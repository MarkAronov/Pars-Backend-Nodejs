// Interface for Route Configuration
export interface RouteConfig {
  requiredParams: string[];
  optionalParams: string[];
  isParameterFree: boolean;
}

// Interface for Parameter List
export type ParameterList = {
  [index: string]: {
    [index: string]: {
      requiredParams: string[];
      optionalParams: string[];
    };
  };
};
