def call(body) {
    def config = [:]
    body.resolveStrategy = Closure.DELEGATE_FIRST
    body.delegate = config
    body()

    pipeline {
        agent {
            kubernetes {
                yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:18-alpine
    command: ["cat"]
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
    - name: workspace
      mountPath: /home/jenkins/agent
  - name: docker
    image: docker:20.10-dind
    securityContext:
      privileged: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
  - name: terraform
    image: hashicorp/terraform:latest
    command: ["cat"]
    tty: true
  - name: ansible
    image: willhallonline/ansible:latest
    command: ["cat"]
    tty: true
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
  - name: workspace
    persistentVolumeClaim:
      claimName: jenkins-workspace
'''
            }
        }

        environment {
            SERVICE = "${config.service}"
            ENVIRONMENT = "${config.environment}"
            VERSION = "${config.version ?: BUILD_NUMBER}"
        }

        stages {
            stage('Validate') {
                steps {
                    script {
                        validateParameters()
                        checkoutCode()
                    }
                }
            }

            stage('Test') {
                when {
                    expression { config.runTests != false }
                }
                steps {
                    script {
                        runTests()
                    }
                }
            }

            stage('Build') {
                steps {
                    script {
                        buildImage()
                    }
                }
            }

            stage('Deploy') {
                when {
                    expression { config.skipDeploy != true }
                }
                steps {
                    script {
                        deployToEnvironment()
                    }
                }
            }
        }

        post {
            always {
                script {
                    cleanup()
                    notify()
                }
            }
        }
    }
}

def validateParameters() {
    if (!SERVICE) {
        error "Service parameter is required"
    }

    if (!ENVIRONMENT) {
        error "Environment parameter is required"
    }

    println "Validating deployment of ${SERVICE} to ${ENVIRONMENT}"
}

def checkoutCode() {
    checkout scm
}

def runTests() {
    dir(SERVICE) {
        sh '''
            npm ci
            npm run test:unit -- --coverage
            npm run test:integration
            npm run test:e2e
        '''
    }
}

def buildImage() {
    dir(SERVICE) {
        sh '''
            docker build -t ${DOCKER_REGISTRY}/${SERVICE}:${VERSION} .
            docker push ${DOCKER_REGISTRY}/${SERVICE}:${VERSION}
        '''
    }
}

def deployToEnvironment() {
    dir('deploy') {
        sh """
            kubectl set image deployment/${SERVICE} ${SERVICE}=${DOCKER_REGISTRY}/${SERVICE}:${VERSION} -n ${ENVIRONMENT}
            kubectl rollout status deployment/${SERVICE} -n ${ENVIRONMENT} --timeout=300s
        """
    }
}

def cleanup() {
    sh 'docker system prune -f'
}

def notify() {
    def status = currentBuild.currentResult
    emailext(
            subject: "${status}: ${SERVICE} deployed to ${ENVIRONMENT}",
            body: "Build ${BUILD_NUMBER} completed with status: ${status}",
            to: 'devops@example.com'
    )
}