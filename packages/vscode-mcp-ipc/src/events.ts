
import type { Jsonifiable } from 'type-fest';

/**
 * Position in a text document expressed as zero-based line and zero-based character offset.
 */
export interface Position {
  line: number;
  character: number;
}

/**
 * A range in a text document expressed as (zero-based) start and end positions.
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Represents a diagnostic, such as a compiler error or warning.
 */
export interface Diagnostic {
  range: Range;
  message: string;
  /** Error, Warning, Information, Hint */
  severity?: 1 | 2 | 3 | 4;
  source?: string;
  code?: string | number;
}

/**
 * Represents a location inside a resource, such as a line inside a text file.
 */
export interface Location {
  uri: string;
  range: Range;
}

/**
 * Represents information about programming constructs like variables, classes, interfaces etc.
 */
export interface SymbolInformation {
  name: string;
  kind: number;
  location: Location;
  containerName?: string;
}



/**
 * The result of a hover request.
 */
export interface Hover {
  contents: string | string[];
  range?: Range;
}

/**
 * Represents a completion item.
 */
export interface CompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

/**
 * Signature help represents the signature of something callable.
 */
export interface SignatureHelp {
  signatures: SignatureInformation[];
  activeSignature?: number;
  activeParameter?: number;
}

export interface SignatureInformation {
  label: string;
  documentation?: string;
  parameters?: ParameterInformation[];
}

export interface ParameterInformation {
  label: string;
  documentation?: string;
}

/**
 * Workspace information
 */
export interface WorkspaceInfo {
  name?: string;
  uri: string;
  folders: Array<{
    uri: string;
    name: string;
  }>;
}

/**
 * Base request structure
 */
export interface BaseRequest {
  id: string;
  method: string;
  params?: Record<string, any>;
}

/**
 * Base response structure
 */
export interface BaseResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    details?: string;
  };
}

/**
 * Event definitions for MCP Server -> VSCode Extension communication
 */
export interface EventMap {
  /** Health check */
  health: {
    params: Record<string, never>;
    result: {
      status: 'ok' | 'error';
      version: string;
      workspace?: string;
    };
  };

  /** LSP Methods */
  getDiagnostics: {
    params: {
      uri: string;
    };
    result: {
      diagnostics: Diagnostic[];
    };
  };

  getDefinition: {
    params: {
      uri: string;
      line: number;
      character: number;
    };
    result: {
      locations: Location[];
    };
  };

  getReferences: {
    params: {
      uri: string;
      line: number;
      character: number;
      includeDeclaration?: boolean;
    };
    result: {
      locations: Location[];
    };
  };

  getHover: {
    params: {
      uri: string;
      line: number;
      character: number;
    };
    result: {
      hover: Hover | null;
    };
  };

  getCompletions: {
    params: {
      uri: string;
      line: number;
      character: number;
    };
    result: {
      items: CompletionItem[];
    };
  };

  getSignatureHelp: {
    params: {
      uri: string;
      line: number;
      character: number;
    };
    result: {
      signatureHelp: SignatureHelp | null;
    };
  };



  getWorkspaceSymbols: {
    params: {
      query: string;
    };
    result: {
      symbols: SymbolInformation[];
    };
  };

  getWorkspaceInfo: {
    params: Record<string, never>;
    result: {
      workspace: WorkspaceInfo;
    };
  };

  /** Execute VSCode command */
  executeCommand: {
    params: {
      command: string;
      args?: Jsonifiable[];
    };
    result: {
      result: Jsonifiable;
    };
  };
}

/**
 * Event names type
 */
export type EventName = keyof EventMap;

/**
 * Event parameters type
 */
export type EventParams<T extends EventName> = EventMap[T]['params'];

/**
 * Event result type
 */
export type EventResult<T extends EventName> = EventMap[T]['result']; 