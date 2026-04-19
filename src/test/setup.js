import '@testing-library/jest-dom';

// jsdom provides localStorage, but we clear it between tests for isolation.
beforeEach(() => {
  localStorage.clear();
});
