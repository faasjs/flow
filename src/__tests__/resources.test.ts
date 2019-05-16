import Flow from '../index';

describe('resources', function () {
  test('unkown', async function () {
    expect(() => new Flow({
      resources: {
        unknow: {},
      },
    }, () => true)).toThrowError('Unknow resource: unknow unknow');
  });
});
