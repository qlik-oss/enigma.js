import createEnigmaError from '../../src/error';

describe('createEnigmaError', () => {
  it('should create a proper enigma error', () => {
    const error = createEnigmaError(-42, 'My custom error');

    expect(error instanceof Error).to.equal(true);
    expect(error.code).to.equal(-42);
    expect(error.message).to.equal('My custom error');
    expect(error.enigmaError).to.equal(true);
  });
});
