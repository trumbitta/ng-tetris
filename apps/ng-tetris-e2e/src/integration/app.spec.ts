import { getGreeting } from '../support/app.po';

describe('ng-tetris', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to ng-tetris!');
  });
});
