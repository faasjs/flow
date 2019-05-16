import Flow from '../index';

describe('invoke', function () {
  test('no found', async function () {
    const flow = new Flow({}, () => true);
    try {
      await flow.invoke(1, {});
    } catch (error) {
      expect(error.message).toEqual('Step#1 not found');
    }
  });
});
