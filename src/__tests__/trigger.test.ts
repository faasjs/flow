import Flow from '../index';

describe('trigger', function () {
  test('unkown', async function () {
    expect(() => new Flow({
      triggers: {
        unknow: {},
      },
    }, () => true)).toThrowError('Unknow trigger: unknow unknow');
  });

  test('not a function', function () {
    expect(() => new Flow({
      triggers: {
        unknow: {
          handler: 1
        },
      },
    }, () => true)).toThrowError('Trigger#unknow is not a function');
  });
});
