const binarySearch = (arr: number[], target: number): {
  isFind: boolean;
  findIndex: number;
} => {
  let left = 0;
  let right = arr.length - 1;
  let insertionPoint = -1; // 初始化为-1，表示元素不在数组中  

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midNum = arr[mid];
    const beforeMidNum = arr[mid - 1];
    const afterMidNum = arr[mid + 1];
    if (midNum === undefined || beforeMidNum === undefined || afterMidNum === undefined) {
      return {
        isFind: false,
        findIndex: -1
      };
    }
    if (midNum < target) {
      // 目标值在mid的右边，更新left  
      left = mid + 1;
      // 更新插入点（如果还没设置过）  
      if (insertionPoint === -1 && mid + 1 < arr.length && afterMidNum > target) {
        insertionPoint = mid + 1;
      }
    } else if (midNum > target) {
      // 目标值在mid的左边，更新right  
      right = mid - 1;
      // 更新插入点（如果还没设置过）  
      if (insertionPoint === -1 && mid - 1 >= 0 && beforeMidNum < target) {
        insertionPoint = mid;
      }
    } else {
      // 找到目标值  
      return { isFind: true, findIndex: mid };
    }
  }

  // 如果循环结束还没找到，则弹出警告并返回插入点  
  if (insertionPoint === -1) {
    // 数组为空或所有元素都比目标值大，插入点在数组末尾  
    insertionPoint = arr.length;
  }
  alert(`元素 ${target} 不在数组中`);
  return {
    isFind: false,
    findIndex: insertionPoint
  };
};

// 示例用法
// const sortedArray = [1, 3, 5, 7, 9];
// const targetValue = 6;
// const index = binarySearch(sortedArray, targetValue);
// console.log(`元素下标：${index}`); // 输出：元素不在数组中后弹出警告，然后输出插入点