import Flow from '../index';

describe('flow', function () {
  test('no step', function () {
    expect(() => new Flow({})).toThrowError('Step required');
  });

  test('unknow step', async function () {
    try {
      await new Flow({}, null).invoke(-1, null)
    } catch (error) {
      expect(error.message).toEqual('Unknow step type: [object Null]');
    }
  });
});
