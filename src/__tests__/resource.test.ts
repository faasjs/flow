import Flow from '../index';

describe('resources', function () {
  test('blank', async function () {
    try {
      await new Flow({
        resource: {},
      }, () => true).createTrigger()({}, {});
    } catch (error) {
      expect(error.message).toEqual('Unknow resource type');
    }
  });

  test('', async function () {
    try {
      await new Flow({
        resource: {
          type: 'unknow'
        },
      }, () => true).createTrigger()({}, {});
    } catch (error) {
      expect(error.message).toEqual('Unknow resource: unknow');
    }
  });

  test('not a function', async function () {
    try {
      await new Flow({
        resource: {
          handler: 1
        },
      }, () => true).createTrigger()({}, {});
    } catch (error) {
      expect(error.message).toEqual('Resource#function<undefined> is not a function');
    }
  });

  test('should work', async function () {
    const res = await new Flow({
      resource: {
        handler: function (resource, flow) {
          flow.invoke = function () {
            return '1';
          };
        }
      },
    }, () => true).createTrigger()({}, {});

    expect(res).toEqual('1');
  });
});
