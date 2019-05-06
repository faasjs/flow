<a name="Flow"></a>

## Flow
**Kind**: global class  

* [Flow](#Flow)
    * [new Flow(config, ...args)](#new_Flow_new)
    * [.processOrigin(origin)](#Flow+processOrigin)

<a name="new_Flow_new"></a>

### new Flow(config, ...args)
新建流程


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | 配置项 |
| config.mode | <code>string</code> | [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行 |
| [config.name] | <code>string</code> | 流程名，不设置时以 文件夹名/文件名 的形式作为流程名 |
| [config.triggers] | <code>object</code> | 触发器配置 |
| [config.env] | <code>object</code> | 环境变量，默认支持 defaults、testing 和 production |
| [config.resource] | <code>IResource</code> | 云函数对应的云资源配置 |
| ...args | <code>Array.&lt;step&gt;</code> | 步骤数组 |

<a name="Flow+processOrigin"></a>

### flow.processOrigin(origin)
处理原始数据

**Kind**: instance method of [<code>Flow</code>](#Flow)  

| Param | Type | Description |
| --- | --- | --- |
| origin | <code>object</code> | 原始数据 |
| origin.type | <code>string</code> \| <code>number</code> | 触发类型 |
| origin.event | <code>object</code> | 事件数据 |
| origin.context | <code>object</code> | 环境数据 |

