"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockProducts } from "@/lib/mock-data"

type CheckoutStep = "shipping" | "payment" | "review"

interface ShippingFormData {
  email: string
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
}

interface PaymentFormData {
  cardNumber: string
  expiry: string
  cvv: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState<CheckoutStep>("shipping")
  const {
    register: registerShipping,
    handleSubmit: handleShippingSubmit,
    formState: { errors: shippingErrors },
  } = useForm<ShippingFormData>({
    mode: "onBlur",
  })
  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    formState: { errors: paymentErrors },
  } = useForm<PaymentFormData>({
    mode: "onBlur",
  })
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null)

  const cartItems = mockProducts.slice(0, 2)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0)
  const shipping = 10
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const onShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data)
    setStep("payment")
  }

  const onPaymentSubmit = () => {
    setStep("review")
  }

  const handlePlaceOrder = () => {
    router.push("/checkout/success/ORD-12345")
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {[
              { name: "Shipping", value: "shipping" },
              { name: "Payment", value: "payment" },
              { name: "Review", value: "review" },
            ].map((s, i) => (
              <motion.div key={s.value} className="flex items-center flex-1">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                    step === s.value || (i < ["shipping", "payment", "review"].indexOf(step))
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {i < ["shipping", "payment", "review"].indexOf(step) ? <Check className="w-5 h-5" /> : i + 1}
                </motion.div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ["shipping", "payment", "review"].indexOf(step) > i
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Shipping</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Payment</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Review</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            {step === "shipping" && (
              <div className="glass rounded-xl p-8 space-y-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Shipping Address</h2>

                <form onSubmit={handleShippingSubmit(onShippingSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      className={`rounded-lg ${shippingErrors.email ? "border-red-500" : ""}`}
                      {...registerShipping("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    {shippingErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{shippingErrors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                        First Name
                      </label>
                      <Input
                        placeholder="John"
                        className={`rounded-lg ${shippingErrors.firstName ? "border-red-500" : ""}`}
                        {...registerShipping("firstName", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters",
                          },
                        })}
                      />
                      {shippingErrors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{shippingErrors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                        Last Name
                      </label>
                      <Input
                        placeholder="Doe"
                        className={`rounded-lg ${shippingErrors.lastName ? "border-red-500" : ""}`}
                        {...registerShipping("lastName", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Last name must be at least 2 characters",
                          },
                        })}
                      />
                      {shippingErrors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{shippingErrors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Address</label>
                    <Input
                      placeholder="123 Main St"
                      className={`rounded-lg ${shippingErrors.address ? "border-red-500" : ""}`}
                      {...registerShipping("address", {
                        required: "Address is required",
                        minLength: {
                          value: 5,
                          message: "Please enter a valid address",
                        },
                      })}
                    />
                    {shippingErrors.address && (
                      <p className="text-red-500 text-sm mt-1">{shippingErrors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">City</label>
                      <Input
                        placeholder="San Francisco"
                        className={`rounded-lg ${shippingErrors.city ? "border-red-500" : ""}`}
                        {...registerShipping("city", {
                          required: "City is required",
                          minLength: {
                            value: 2,
                            message: "City must be at least 2 characters",
                          },
                        })}
                      />
                      {shippingErrors.city && (
                        <p className="text-red-500 text-sm mt-1">{shippingErrors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">State</label>
                      <Input
                        placeholder="CA"
                        className={`rounded-lg ${shippingErrors.state ? "border-red-500" : ""}`}
                        {...registerShipping("state", {
                          required: "State is required",
                          minLength: {
                            value: 2,
                            message: "State must be at least 2 characters",
                          },
                        })}
                      />
                      {shippingErrors.state && (
                        <p className="text-red-500 text-sm mt-1">{shippingErrors.state.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">ZIP</label>
                      <Input
                        placeholder="94102"
                        className={`rounded-lg ${shippingErrors.zip ? "border-red-500" : ""}`}
                        {...registerShipping("zip", {
                          required: "ZIP code is required",
                          pattern: {
                            value: /^\d{5}(-\d{4})?$/,
                            message: "Invalid ZIP code",
                          },
                        })}
                      />
                      {shippingErrors.zip && <p className="text-red-500 text-sm mt-1">{shippingErrors.zip.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Phone</label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className={`rounded-lg ${shippingErrors.phone ? "border-red-500" : ""}`}
                      {...registerShipping("phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^[\d\s\-+()]+$/,
                          message: "Invalid phone number",
                        },
                      })}
                    />
                    {shippingErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{shippingErrors.phone.message}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button asChild variant="outline" className="rounded-lg flex-1 bg-transparent">
                      <Link href="/cart">Back</Link>
                    </Button>
                    <Button type="submit" className="rounded-lg flex-1 gap-2">
                      Continue to Payment
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === "payment" && (
              <div className="glass rounded-xl p-8 space-y-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Payment Method</h2>

                <div className="space-y-3">
                  {[
                    { id: "card", label: "Credit/Debit Card" },
                    { id: "paypal", label: "PayPal" },
                    { id: "transfer", label: "Bank Transfer" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <input type="radio" name="payment" defaultChecked={method.id === "card"} />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{method.label}</span>
                    </label>
                  ))}
                </div>

                <form
                  onSubmit={handlePaymentSubmit(onPaymentSubmit)}
                  className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Card Number
                    </label>
                    <Input
                      placeholder="4242 4242 4242 4242"
                      className={`rounded-lg font-mono ${paymentErrors.cardNumber ? "border-red-500" : ""}`}
                      {...registerPayment("cardNumber", {
                        required: "Card number is required",
                        pattern: {
                          value: /^\d{13,19}$/,
                          message: "Invalid card number",
                        },
                      })}
                    />
                    {paymentErrors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{paymentErrors.cardNumber.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Expiry</label>
                      <Input
                        placeholder="MM/YY"
                        className={`rounded-lg ${paymentErrors.expiry ? "border-red-500" : ""}`}
                        {...registerPayment("expiry", {
                          required: "Expiry date is required",
                          pattern: {
                            value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                            message: "Use MM/YY format",
                          },
                        })}
                      />
                      {paymentErrors.expiry && (
                        <p className="text-red-500 text-sm mt-1">{paymentErrors.expiry.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">CVV</label>
                      <Input
                        placeholder="123"
                        className={`rounded-lg font-mono ${paymentErrors.cvv ? "border-red-500" : ""}`}
                        {...registerPayment("cvv", {
                          required: "CVV is required",
                          pattern: {
                            value: /^\d{3,4}$/,
                            message: "Invalid CVV",
                          },
                        })}
                      />
                      {paymentErrors.cvv && <p className="text-red-500 text-sm mt-1">{paymentErrors.cvv.message}</p>}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => setStep("shipping")}
                      variant="outline"
                      className="rounded-lg flex-1 bg-transparent"
                    >
                      Back
                    </Button>
                    <Button type="submit" className="rounded-lg flex-1 gap-2">
                      Review Order
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === "review" && (
              <div className="glass rounded-xl p-8 space-y-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Review Your Order</h2>

                <div className="space-y-4">
                  <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Shipping To:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {shippingData?.firstName} {shippingData?.lastName}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {shippingData?.address}, {shippingData?.city}, {shippingData?.state} {shippingData?.zip}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Items:</p>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-900 dark:text-zinc-100">{item.name}</span>
                        <span className="text-zinc-600 dark:text-zinc-400">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep("payment")}
                    variant="outline"
                    className="rounded-lg flex-1 bg-transparent"
                  >
                    Back
                  </Button>
                  <Button onClick={handlePlaceOrder} className="rounded-lg flex-1 gap-2">
                    Place Order
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 h-fit sticky top-24"
          >
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6">Order Summary</h3>

            <div className="space-y-3 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{item.name}</span>
                  <span className="text-zinc-900 dark:text-zinc-100">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
