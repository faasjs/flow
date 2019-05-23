<a name="Flow"></a>

## Flow
**Kind**: global class  

* [Flow](#Flow)
    * [new Flow(config, ...steps)](#new_Flow_new)
    * [.createTrigger(type)](#Flow+createTrigger)
    * [.invoke(index, data)](#Flow+invoke)
    * [.remoteInvoke(index, data)](#Flow+remoteInvoke)
    * [.processOrigin(origin)](#Flow+processOrigin)
    * [.onMounted()](#Flow+onMounted)

<a name="new_Flow_new"></a>

### new Flow(config, ...steps)
新建流程


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | 配置项 |
| config.mode | <code>string</code> | [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行 |
| [config.name] | <code>string</code> | 流程名，不设置时以 文件夹名/文件名 的形式作为流程名 |
| [config.triggers] | <code>object</code> | 触发器配置 |
| [config.resources] | <code>object</code> | 额外引用的云资源 |
| [config.env] | <code>object</code> | 环境变量，默认支持 defaults、testing 和 production |
| [config.resource] | <code>Resource</code> | 云函数对应的云资源配置 |
| ...steps | <code>Array.&lt;step&gt;</code> | 步骤数组 |

<a name="Flow+createTrigger"></a>

### flow.createTrigger(type)
创建触发函数

**Kind**: instance method of [<code>Flow</code>](#Flow)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> \| <code>number</code> | 类型，若为数字则表示为触发第几步步骤 |

<a name="Flow+invoke"></a>

### flow.invoke(index, data)
立即执行步骤

**Kind**: instance method of [<code>Flow</code>](#Flow)  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | 步骤次序 |
| data | <code>object</code> | 数据 |

<a name="Flow+remoteInvoke"></a>

### flow.remoteInvoke(index, data)
异步远程执行步骤

**Kind**: instance method of [<code>Flow</code>](#Flow)  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | 步骤次序 |
| data | <code>object</code> | 数据 |

<a name="Flow+processOrigin"></a>

### flow.processOrigin(origin)
处理原始数据

**Kind**: instance method of [<code>Flow</code>](#Flow)  

| Param | Type | Description |
| --- | --- | --- |
| origin | <code>object</code> | 原始数据 |
| origin.type | <code>string</code> | 触发类型 |
| origin.event | <code>object</code> | 事件数据 |
| origin.context | <code>object</code> | 环境数据 |

<a name="Flow+onMounted"></a>

### flow.onMounted()
容器实例创建时进行容器实例的初始化

**Kind**: instance method of [<code>Flow</code>](#Flow)  
