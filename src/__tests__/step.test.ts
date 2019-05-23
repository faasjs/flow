import Flow from '../index';

describe('step', function () {
  test('no step', function () {
    expect(() => new Flow({})).toThrowError('Step required');
  });

  test('unknow step', async function () {
    expect(() => new Flow({}, null)).toThrowError('Unknow step#0');
  });

  test('unknow step type', async function () {
    expect(() => new Flow({}, {})).toThrowError('Unknow step#0\'s type');
  });

  test('throw step', async function () {
    const trigger = new Flow({},
      function () {
        throw Error('step');
      },
    ).createTrigger();

    expect(await trigger({}, {})).toEqual(Error('step'));
  });

  test('custom step', async function () {
    expect(() => new Flow({}, { handler: () => true })).not.toThrowError();
  });
});
