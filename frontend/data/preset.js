// data/preset.js
// 前端内置预置题库（兜底）：后端不可用（接口挂掉/超时/网络失败）时自动切换，保证演示不中断
// 结构必须与 /generate 接口响应的 questions 数组完全一致（参考 API.md v1.1）
// 题目基于正式演示资料《计算机组成原理基础》《数据结构基础》知识块编写，explanation 按"原文：…。解析：…"格式
const PRESET_QUESTIONS = [
  {
    id: "pq_001", type: "single", stem: "下列关于计算机系统层次结构的说法，正确的是？",
    options: ["A. 应用程序直接操作硬件，不经操作系统", "B. 各层通过约定的接口协作，上层利用下层提供的功能", "C. 操作系统负责执行编译程序", "D. 硬件层直接包含应用程序"],
    answer: "B", explanation: "原文：计算机系统可以按功能划分为多个层次，应用程序通过操作系统等软件使用硬件资源，各层通过规定的接口协同工作。解析：层次结构中上层利用下层功能，因此选 B。",
    knowledge_point_id: "kp_co_001", source_excerpt: "计算机系统可以按功能划分为多个层次。应用程序通过操作系统等软件使用硬件资源；各层通过规定的接口协同工作。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_002", type: "single", stem: "经典计算机的五大组成部分不包括下列哪一项？",
    options: ["A. 运算器", "B. 控制器", "C. 存储器", "D. 操作系统"],
    answer: "D", explanation: "原文：经典计算机由运算器、控制器、存储器、输入设备和输出设备组成。解析：操作系统属于软件，不属于硬件五大组成部分，因此选 D。",
    knowledge_point_id: "kp_co_002", source_excerpt: "经典计算机由运算器、控制器、存储器、输入设备和输出设备组成。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_003", type: "single", stem: "冯·诺依曼结构“存储程序”思想的核心含义是？",
    options: ["A. 程序指令和数据以编码形式存放在存储器中，按指令顺序自动执行", "B. 程序只能存放在外部存储设备中", "C. 指令必须由人工逐条输入", "D. 数据只能存放在寄存器中"],
    answer: "A", explanation: "原文：存储程序思想强调将程序指令和数据以编码形式存放在存储器中，计算机在控制器的协调下按指令顺序执行程序。解析：存储程序即“程序先存进存储器、再自动执行”，因此选 A。",
    knowledge_point_id: "kp_co_003", source_excerpt: "存储程序思想强调将程序指令和数据以编码形式存放在存储器中，计算机在控制器的协调下按指令顺序执行程序。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_004", type: "single", stem: "中央处理器（CPU）的基本职责不包括？",
    options: ["A. 取指令并分析指令", "B. 执行算术与逻辑运算", "C. 协调计算机各部件工作", "D. 直接生成最终的用户界面"],
    answer: "D", explanation: "原文：中央处理器主要由运算部件和控制部件等构成，负责取指令、分析指令、执行指令，并控制计算机各部件协调工作。解析：生成用户界面不属于 CPU 基本职责，因此选 D。",
    knowledge_point_id: "kp_co_004", source_excerpt: "中央处理器主要由运算部件和控制部件等构成，负责取指令、分析指令、执行指令，并控制计算机各部件协调工作。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_005", type: "single", stem: "指令执行过程通常包括取指、译码以及下列哪些可能的阶段？",
    options: ["A. 运算、访存、写回", "B. 断电、重启、格式化", "C. 编译、链接、装载", "D. 输入、打印、关机"],
    answer: "A", explanation: "原文：指令执行过程通常包括取指和译码，并根据指令类型完成运算、访存或数据写回等操作。解析：运算、访存、写回属于指令执行阶段，因此选 A。",
    knowledge_point_id: "kp_co_005", source_excerpt: "指令执行过程通常包括取指和译码，并根据指令类型完成运算、访存或数据写回等操作。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_006", type: "blank", stem: "____位于处理器内部，用于暂存操作数、地址、中间结果或控制状态等信息。",
    options: [], answer: "寄存器", explanation: "原文：寄存器位于处理器内部，用于暂存指令执行所需的信息，例如操作数、地址、中间结果或控制状态。解析：CPU 内部用于暂存信息的快速存储部件即寄存器。",
    knowledge_point_id: "kp_co_006", source_excerpt: "寄存器位于处理器内部，用于暂存指令执行所需的信息，例如操作数、地址、中间结果或控制状态。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_007", type: "single", stem: "关于存储器层次结构，下列说法正确的是？",
    options: ["A. 越靠近 CPU 的存储部件速度越快、容量越小、单位成本越高", "B. 越靠近 CPU 的存储部件速度越慢、容量越大", "C. 辅助存储器速度最快", "D. 缓存容量比主存大"],
    answer: "A", explanation: "原文：存储器层次结构通过不同速度、容量和成本的存储部件协同工作，寄存器和缓存速度较快、容量较小，主存容量较大，辅助存储器通常用于长期保存数据。解析：越靠近 CPU 越快、越小、越贵，因此选 A。",
    knowledge_point_id: "kp_co_007", source_excerpt: "寄存器和缓存速度较快、容量较小，主存容量较大，辅助存储器通常用于长期保存数据。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_008", type: "single", stem: "高速缓存（Cache）减少 CPU 访问较慢主存平均时间所利用的原理是？",
    options: ["A. 时间局部性和空间局部性", "B. 随机存取原理", "C. 分布式计算原理", "D. 虚拟化原理"],
    answer: "A", explanation: "原文：高速缓存用于保存主存中近期访问或可能很快再次访问的数据，其效果与程序访问的时间局部性和空间局部性有关。解析：Cache 依赖局部性原理提高命中率，因此选 A。",
    knowledge_point_id: "kp_co_008", source_excerpt: "高速缓存用于保存主存中近期访问或可能很快再次访问的数据。其效果与程序访问的时间局部性和空间局部性有关。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_009", type: "single", stem: "按传送信息类型划分，常见总线分类不包括？",
    options: ["A. 数据总线", "B. 地址总线", "C. 控制总线", "D. 电源总线"],
    answer: "D", explanation: "原文：按传送信息类型，常见分类包括数据总线、地址总线和控制总线。解析：数据、地址、控制总线是常见分类，电源总线不属于该分类，因此选 D。",
    knowledge_point_id: "kp_co_009", source_excerpt: "按传送信息类型，常见分类包括数据总线、地址总线和控制总线。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_010", type: "single", stem: "中断机制在输入输出系统中的主要作用是？",
    options: ["A. 允许设备或其他事件向 CPU 发出请求，使 CPU 在适当时机转去处理", "B. 提高显示器的分辨率", "C. 增加主存容量", "D. 替代操作系统进行文件管理"],
    answer: "A", explanation: "原文：输入输出系统负责主机与外部设备之间的信息交换。中断机制使处理器能够响应设备或程序运行过程中出现的特定事件。解析：中断用于让 CPU 响应设备等事件请求，因此选 A。",
    knowledge_point_id: "kp_co_010", source_excerpt: "中断机制使处理器能够响应设备或程序运行过程中出现的特定事件。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_011", type: "single", stem: "理解数据结构时，通常需要区分的三个方面是？",
    options: ["A. 逻辑结构、存储结构和数据操作", "B. 硬件结构、软件结构和网络结构", "C. 输入结构、输出结构和缓存结构", "D. 线性结构、树形结构和图形结构"],
    answer: "A", explanation: "原文：理解数据结构时，通常需要区分逻辑结构、存储结构和数据操作三个方面。解析：逻辑结构、存储结构、数据操作是数据结构研究的基本方面，因此选 A。",
    knowledge_point_id: "kp_ds_001", source_excerpt: "理解数据结构时，通常需要区分逻辑结构、存储结构和数据操作三个方面。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_012", type: "single", stem: "数据元素之间存在“一对多”关系时，通常属于哪种逻辑结构？",
    options: ["A. 集合结构", "B. 线性结构", "C. 树形结构", "D. 图形结构"],
    answer: "C", explanation: "原文：树形结构体现一对多关系；图形结构中的元素可能存在多对多关系。解析：树形结构体现一对多关系，因此选 C。",
    knowledge_point_id: "kp_ds_002", source_excerpt: "树形结构体现一对多关系；图形结构中的元素可能存在多对多关系。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_013", type: "single", stem: "链式存储结构与顺序存储结构相比，主要特点是？",
    options: ["A. 存储位置不必连续，通过指针或链接字段表示元素间关系", "B. 必须占用地址连续的内存", "C. 只能存储整数类型数据", "D. 不需要任何额外的存储开销"],
    answer: "A", explanation: "原文：链式存储结构通过结点中的链接信息连接相关元素，存储位置不必连续。解析：链式存储利用链接字段表示关系、位置可不连续，因此选 A。",
    knowledge_point_id: "kp_ds_003", source_excerpt: "链式存储结构通过结点中的链接信息连接相关元素。两种方式在存储空间使用和操作效率方面各有特点。", cognitive_level: "理解", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_014", type: "blank", stem: "线性表是具有相同数据类型的 n 个数据元素组成的____序列（填“有限”或“无限”）。",
    options: [], answer: "有限", explanation: "原文：线性表是具有相同数据类型的数据元素构成的有限序列。解析：线性表中的元素个数 n 是有限的，因此填“有限”。",
    knowledge_point_id: "kp_ds_004", source_excerpt: "线性表是具有相同数据类型的数据元素构成的有限序列。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_015", type: "single", stem: "栈最突出的特点是？",
    options: ["A. 后进先出（LIFO）", "B. 先进先出（FIFO）", "C. 随机访问", "D. 双端同时删除"],
    answer: "A", explanation: "原文：栈限定在栈顶进行插入和删除操作，最后进入栈的元素最先离开栈。解析：栈的特点为后进先出（LIFO），因此选 A。",
    knowledge_point_id: "kp_ds_005", source_excerpt: "栈限定在栈顶进行插入和删除操作。新加入的元素成为新的栈顶元素，最后进入栈的元素最先离开栈。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_016", type: "single", stem: "队列遵循的出入队原则是？",
    options: ["A. 先进先出（FIFO）", "B. 后进先出（LIFO）", "C. 随机进出", "D. 按优先级任意进出"],
    answer: "A", explanation: "原文：队列的插入操作一般在队尾进行，删除操作一般在队头进行，先进入队列的元素会先被删除。解析：队列遵循先进先出（FIFO），因此选 A。",
    knowledge_point_id: "kp_ds_006", source_excerpt: "队列的插入操作一般在队尾进行，删除操作一般在队头进行。按照元素进入队列的先后顺序，先进入队列的元素会先被删除。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_017", type: "single", stem: "二叉树中每个结点最多可以有几个子结点？",
    options: ["A. 一个", "B. 两个", "C. 三个", "D. 任意多个"],
    answer: "B", explanation: "原文：二叉树的每个结点最多有两个子结点，并可区分为左子结点和右子结点。解析：二叉树每个结点最多有两个子结点，因此选 B。",
    knowledge_point_id: "kp_ds_007", source_excerpt: "二叉树的每个结点最多有两个子结点，并可区分为左子结点和右子结点。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_018", type: "single", stem: "根据边是否具有方向，图可分为？",
    options: ["A. 有向图和无向图", "B. 线性图和树形图", "C. 稀疏图和稠密图", "D. 静态图和动态图"],
    answer: "A", explanation: "原文：根据边是否具有方向，可分为有向图和无向图。无向图中的边没有方向，有向图中的边具有方向。解析：按边是否有方向分为有向图和无向图，因此选 A。",
    knowledge_point_id: "kp_ds_008", source_excerpt: "根据边是否具有方向，可分为有向图和无向图。无向图中的边没有方向，有向图中的边具有方向。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_019", type: "single", stem: "查找操作的基本含义是？",
    options: ["A. 在数据集合中确定是否存在满足给定条件的数据元素，并可能需要返回其位置", "B. 将数据元素按顺序排列", "C. 删除数据集合中的所有元素", "D. 复制整个数据集合"],
    answer: "A", explanation: "原文：查找操作根据给定的关键字或条件，在数据集合中寻找目标元素，结果可以是找到的元素或其位置。解析：查找即按条件寻找目标元素，因此选 A。",
    knowledge_point_id: "kp_ds_009", source_excerpt: "查找操作根据给定的关键字或条件，在数据集合中寻找目标元素。查找结果可以是找到的元素或其位置。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  },
  {
    id: "pq_020", type: "blank", stem: "排序是按照指定关键字及其比较规则，将一组数据元素重新排列，使其满足递增、____或其他规定的次序。",
    options: [], answer: "递减", explanation: "原文：排序操作根据某个或多个关键字的比较结果，调整数据元素的排列顺序，常见目标包括按关键字从小到大排列或从大到小排列。解析：排序结果可为递增或递减次序，因此填“递减”。",
    knowledge_point_id: "kp_ds_010", source_excerpt: "常见目标包括按关键字从小到大排列或从大到小排列。", cognitive_level: "记忆", steps: 1, difficulty: "简单"
  }
]

module.exports = { PRESET_QUESTIONS }
