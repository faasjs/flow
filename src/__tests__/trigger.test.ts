import Flow from '../index';

describe('trigger', function () {
  test('mounted', async function () {
    const flow = new Flow({
      resource: {
        handler: () => 1
      }
    }, () => true);
    const trigger = flow.createTrigger();

    expect(flow.mounted).toBeFalsy();

    await trigger({}, {});

    expect(flow.mounted).toBeTruthy();
  });

  test('unkown', async function () {
    try {
      await new Flow({
        resource: {
          handler: () => 1
        },
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
        resource: {
          handler: () => 1
        },
        triggers: {
          unknow: {
            handler: 1
          },
        },
      }, () => true).createTrigger()({}, {});
    } catch (error) {
      expect(error.message).toEqual('Trigger#unknow<undefined> is not a function');
    }
  });
});
