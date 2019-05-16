import Flow from '../index';

describe('resources', function () {
  test('unkown', async function () {
    expect(() => new Flow({
      resources: {
        unknow: {},
      },
    }, () => true)).toThrowError('Unknow resource: unknow unknow');
  });

  test('not a function', function () {
    expect(() => new Flow({
      resources: {
        unknow: {
          handler: 1
        },
      },
    }, () => true)).toThrowError('Resource#unknow is not a function');
  });

  test('should work', async function () {
    const trigger = new Flow({
      resources: {
        custom: {
          handler: function () {
            return 1;
          }
        }
      }
    }, function () {
      return this.custom;
    }).createTrigger();

    const res = await trigger({}, {});

    expect(res).toEqual(1);
  });
});
