// Automation services
export { AutomationService, getAutomationService, initAutomationService, resetAutomationService } from './automation-service';
export { CRMEntityLoader, crmEntityLoader } from './entity-loader';
export { crmEventEmitter, type EmitEventOptions } from './event-emitter';
export * from './event-emitter';

// Other services
export { activityService } from './activity-service';
export { duplicateDetectionService } from './duplicate-detection';
export { createActionExecutors } from './action-executors';
