import Flow from '../index';

describe('trigger', function () {
  test('unkown', async function () {
    try {
      await new Flow({
        triggers: {
          unknow: {},
        },
      }, () => true).createTrigger()({}, {});
    } catch (error) {
      expect(error.message).toEqual('Unknow trigger: unknow unknow');
    }
  });

  test('not a function', async function () {
    try {
      await new Flow({
        triggers: {
          unknow: {
            handler: 1
          },
        },
      }, () => true).createTrigger()({}, {});
    } catch (error) {
      expect(error.message).toEqual('Trigger#unknow is not a function');
    }
  });
});
