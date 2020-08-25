export interface Conf {
    token: string;
    pythonInterpreter: string;
    toxicDeleteConfidence: number;
    toxicKickConfidence: number;
    severeToxicDeleteConfidence: number;
    severeToxicKickConfidence: number;
    obsceneDeleteConfidence: number;
    obsceneKickConfidence: number;
    threatDeleteConfidence: number;
    threatKickConfidence: number;
    insultDeleteConfidence: number;
    insultKickConfidence: number;
    hateDeleteConfidence: number;
    hateKickConfidence: number;
    serverUrl: string;
    debugMode: boolean;
}