// Export theme components
export * from './theme';

// Re-export types, constants, and utils from web-container
// This avoids duplication while maintaining backward compatibility
export * from '../web-container/types';
export * from '../web-container/constants';
export * from '../web-container/utils';

// Note: WebContainer is now exported from the web-container directory 