// src/common/utils/operation-parser.util.ts
import {
  parse,
  DocumentNode,
  OperationDefinitionNode,
  Kind,
  FieldNode,
  SelectionNode,
} from 'graphql';

export interface OperationInfo {
  name: string;
  type: 'query' | 'mutation' | 'subscription';
  fields: string[];
  depth: number;
  aliasCount: number;
}

export class OperationParser {
  /**
   * Parse a GraphQL query string and extract operation info
   */
  static parse(query: string, operationName?: string): OperationInfo {
    let document: DocumentNode;

    try {
      document = parse(query);
    } catch (error) {
      throw new Error(`Invalid GraphQL query: ${error.message}`);
    }

    return this.extractInfo(document, operationName);
  }

  /**
   * Extract operation info from a parsed document
   */
  static extractInfo(
    document: DocumentNode,
    operationName?: string,
  ): OperationInfo {
    const operations = document.definitions.filter(
      (def): def is OperationDefinitionNode =>
        def.kind === Kind.OPERATION_DEFINITION,
    );

    if (operations.length === 0) {
      return {
        name: 'Unknown',
        type: 'query',
        fields: [],
        depth: 0,
        aliasCount: 0,
      };
    }

    // Find the target operation
    let operation: OperationDefinitionNode;

    if (operationName) {
      operation =
        operations.find((op) => op.name?.value === operationName) ||
        operations[0];
    } else {
      operation = operations[0];
    }

    // Extract top-level fields
    const fields = operation.selectionSet.selections
      .filter((sel): sel is FieldNode => sel.kind === Kind.FIELD)
      .map((field) => field.name.value);

    // Calculate depth
    const depth = this.calculateDepth(operation.selectionSet.selections);

    // Count aliases
    const aliasCount = this.countAliases(operation.selectionSet.selections);

    return {
      name: operation.name?.value || 'Anonymous',
      type: operation.operation,
      fields,
      depth,
      aliasCount,
    };
  }

  /**
   * Calculate the maximum depth of a selection set
   */
  private static calculateDepth(
    selections: readonly SelectionNode[],
    currentDepth = 1,
  ): number {
    let maxDepth = currentDepth;

    for (const selection of selections) {
      if (selection.kind === Kind.FIELD && selection.selectionSet) {
        const nestedDepth = this.calculateDepth(
          selection.selectionSet.selections,
          currentDepth + 1,
        );
        maxDepth = Math.max(maxDepth, nestedDepth);
      }
    }

    return maxDepth;
  }

  /**
   * Count the number of aliases in a selection set
   */
  private static countAliases(selections: readonly SelectionNode[]): number {
    let count = 0;

    for (const selection of selections) {
      if (selection.kind === Kind.FIELD) {
        if (selection.alias) {
          count++;
        }
        if (selection.selectionSet) {
          count += this.countAliases(selection.selectionSet.selections);
        }
      }
    }

    return count;
  }
}
