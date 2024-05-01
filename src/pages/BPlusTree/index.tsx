import { Button, Dialog, DialogActions, DialogTitle, Paper, TextField } from "@mui/material";
import { useGetState, useMemoizedFn } from "ahooks";
import { useCallback } from "react";
import { unstable_batchedUpdates } from "react-dom";
import style from './_index.module.scss';
const { pow } = Math;
// enum initFile {
//   writeOnceTypedArray,
//   writeOnceDataView,
//   writeOnceString,
//   writeManyTypedArray,
//   writeManyDataView,
//   writeManyString,
// }
// const chosed: initFile = initFile.writeOnceTypedArray;
// const asciiInit = 33; //!
// const choiceArrBufferSplit = async (file: File, i: number) => {
//   const choice: number = 0;
//   switch (choice) {
//     case 0: { //method 1:
//       const splieBlob = file.slice(i, i + lineSize);
//       const arrBufferSplit = await splieBlob.arrayBuffer();
//       return arrBufferSplit;
//     }
//     case 1: { //method 2:
//       const arrBuffer = await file.arrayBuffer();
//       const arrBufferSplit = arrBuffer.slice(i, i + lineSize);
//       return arrBufferSplit;
//     }
//     default: {
//       return new ArrayBuffer(lineSize);
//     }
//   }
// };
const fileSize = 16 * 1024;
const lineSize = 64;
const lineCount = fileSize / lineSize;  //256
const NL_line_feed = 10;
// 0~256*256*256-1
// 0~256*256-1 0~255,256~511
// 256*256~256*256*2-1 256*256~256*256+256-1,256*256+256~256*256+256*2-1
const givePermission = async () => {
  const DirectoryPicker = await window.showDirectoryPicker();
  const descriptor: FileSystemHandlePermissionDescriptor = { mode: 'readwrite', writable: true };
  while (true) {
    const PermissionState = await DirectoryPicker.queryPermission(descriptor);
    if (PermissionState === 'granted') {
      break;
    } else {
      await DirectoryPicker.requestPermission(descriptor);
    }
  }
  return DirectoryPicker;
};
// givePermission();
const level = 3;
const maxCacheLength = 4;
const createFile = async (DirectoryPicker: FileSystemDirectoryHandle, ...indexs: ReadonlyArray<number>) => {
  const joinName = indexs.join('_');
  const valueName = joinName ? `${joinName}_` : '';
  const fileHandle = await DirectoryPicker.getFileHandle(`${joinName}.txt`, {
    create: true
  });
  const initNum = indexs.reduce((pre, cur, index) => {
    return pre + cur * pow(lineCount, level - index - 1);
  }, 0);
  const WritableFileStream = await fileHandle.createWritable();
  const typeArr = new Uint8Array(fileSize);
  // 0~256*256*256-1  .txt
  for (let i = 0; i < lineCount; ++i) {
    const lineSizeSubArr = new Uint8Array(lineSize);
    const key = pow(lineCount, level - indexs.length - 1) * (i + 1) + initNum;
    const arr = key.toString().split('').map(i => i.charCodeAt(0));
    const value = `${valueName}${i}`.split('').map(i => i.charCodeAt(0));
    lineSizeSubArr.set(arr, 0);
    lineSizeSubArr.set(value, arr.length + 1);
    lineSizeSubArr[lineSize - 1] = NL_line_feed;
    typeArr.set(lineSizeSubArr, i * lineSize);
  }
  await WritableFileStream.write(typeArr);
  await WritableFileStream.close();
};
const getStrOfFileLine = async (typeArr: Uint8ClampedArray, l: number = 0) => {
  let key = '';
  for (; l < lineSize; ++l) {
    const n = typeArr[l];
    if (!n) {
      break;
    }
    key += String.fromCharCode(n);
  }
  return key;
};
const fileToEachLine = async (file: File, start: number) => {
  const offset = start * lineSize;
  return new Uint8ClampedArray(await file.slice(offset, offset + lineSize).arrayBuffer());
};
const isRightSearchKey = (searchKey: number, num: number, i: number) => (searchKey <= num && searchKey > num - pow(lineCount, level - i - 1));
interface Logs {
  readonly searchKey: string;
  readonly thisLogs: Array<{
    readonly method: '内存' | '磁盘';
    readonly fileName: string,
  }>;
}
// enum mode{
//   create,
//   delete
// }
const getNextFileNameResult = async (file: File, i: number, j: number, searchKeyNum: number): Promise<{
  empty?: boolean;
  value?: string;
}> => {
  const typeArr = await fileToEachLine(file, j);
  const key = await getStrOfFileLine(typeArr);
  if (!key) {
    return { empty: true };
  }
  const num = parseInt(key);
  if (isRightSearchKey(searchKeyNum, num, i)) {
    return { value: await getStrOfFileLine(typeArr, key.length + 1) };
  }
  return {};
};
enum modeEnum {
  read,
  create,
  delete
}
const canCreateOrDelete = async (mode: modeEnum, fileHandle: () => Promise<FileSystemFileHandle>, file: File, k: number, clearCache: () => void) => {
  switch (mode) {
    case modeEnum.create: {
      alert('create fail');
      return true;
    }
    case modeEnum.delete: {
      // const fileHandle = await DirectoryPicker.getFileHandle(`${nextIOFileName}.txt`, {
      //   create: true
      // });
      const WritableFileStream = await (await fileHandle()).createWritable();
      const typeArr = new Uint8ClampedArray(await file.arrayBuffer());
      typeArr.set(new Uint8ClampedArray(lineSize - 1), k * lineSize);
      WritableFileStream.write(typeArr);
      WritableFileStream.close();
      clearCache();
      alert('delete success');
      return true;
    }
  }
  return false;
};
export default function BPlusTree () {
  const [DirectoryPicker, setDirectoryPicker, getDirectoryPicker] = useGetState<FileSystemDirectoryHandle>();
  const [cachesList, setCachesList, getCachesList] = useGetState<Array<{
    readonly fileName: string,
    timestamp: number;
    readonly file: File;
    readonly index: number;
  }>>();
  const clearCache = () => {
    setCachesList((cachesList) => {
      return cachesList?.filter(i => i.index !== level - 1);
    });
  };
  const [logs, setLogs, getLogs] = useGetState<ReadonlyArray<Logs>>([]);
  const initGivePermission = useMemoizedFn(async () => {
    setDirectoryPicker(await givePermission());
  });
  const [, setSearchKey, getSearchKey] = useGetState('3');
  const [searchValue, setSearchValue, getSearchValue] = useGetState('');
  const [insertValue, setInsertValue] = useGetState('');
  const getDirectoryPickerFn = useCallback(async () => {
    let DirectoryPicker = getDirectoryPicker();
    if (!DirectoryPicker) {
      DirectoryPicker = await givePermission();
      setDirectoryPicker(DirectoryPicker);
    }
    return DirectoryPicker;
  }, [DirectoryPicker]);
  const onClick = (mode: modeEnum = modeEnum.read) => unstable_batchedUpdates(async () => {
    let emptyLine = NaN;
    const cachesList = getCachesList() ?? [];
    const searchKey = getSearchKey();
    const searchKeyNum = parseInt(searchKey);
    const log: Logs = { searchKey, thisLogs: [] };
    const DirectoryPicker = await getDirectoryPickerFn();
    let nextIOFileName = '';
    levelFor: for (let i = 0; i < level; i++) {
      //从内存中
      for (let j = 0; j < cachesList.length; ++j) {
        const thisCache = cachesList[j];
        // const index = thisCache?.index ?? 0;
        if (thisCache && thisCache?.index === i) {
          const { file } = thisCache;
          //each line
          for (let k = 0; k < lineCount; ++k) {
            const result = await getNextFileNameResult(file, i, k, searchKeyNum);
            if (mode === modeEnum.create)
              if (i === level - 1 && result.empty) {
                if (Number.isNaN(emptyLine)) {
                  emptyLine = k;
                }
              }
            const value = result.value;
            if (value) {
              if (i === level - 1) {
                const fn = async () => {
                  return await DirectoryPicker.getFileHandle(`${nextIOFileName}.txt`);
                };
                if (await canCreateOrDelete(mode, fn, file, k, clearCache)) {
                  return;
                }
              }
              nextIOFileName = value;
              // thisCache.timestamp = index ? Date.now() : index;
              thisCache.timestamp = Date.now();
              log.thisLogs.push({
                method: '内存',
                fileName: thisCache.fileName,
              });
              continue levelFor;
            }
          }
        }
      }
      //I/O
      const fileHandle = await DirectoryPicker.getFileHandle(`${nextIOFileName}.txt`, {
        create: true
      });
      const file = await fileHandle.getFile();
      //each line
      for (let j = 0; j < lineCount; ++j) {
        const result = await getNextFileNameResult(file, i, j, searchKeyNum);
        if (mode === modeEnum.create)
          if (i === level - 1 && result.empty) {
            if (Number.isNaN(emptyLine)) {
              emptyLine = j;
            }
          }
        const value = result.value;
        if (value) {
          if (i === level - 1)
            if (await canCreateOrDelete(mode, async () => fileHandle, file, j, clearCache)) {
              return;
            }
          //缓存算法
          if (cachesList.length >= maxCacheLength) {
            cachesList.pop();
          }
          cachesList.push({
            fileName: nextIOFileName,
            timestamp: Date.now(),
            file,
            index: i,
          });
          log.thisLogs.push({
            method: '磁盘',
            fileName: nextIOFileName,
          });
          nextIOFileName = value;
          cachesList.sort((a, b) => {
            if (a.index === b.index)
              return b.timestamp - a.timestamp;
            return a.index - b.index;
          });
          // cachesList.sort((a, b) => {
          //   if (a.index === 0)
          //     return -1;
          //   if (b.index === 0)
          //     return 1;
          //   return a.timestamp - b.timestamp;
          // });
          // cachesList.sort((a, b) => a.timestamp - b.timestamp);
          continue levelFor;
        }
      }
      if (Number.isNaN(emptyLine)) {
        emptyLine = file.size;
      } else {
        emptyLine *= lineSize;
      }
      switch (mode) {
        case modeEnum.create: {
          if (!insertValue || !searchKey) {
            alert('input require');
            return;
          }
          const WritableFileStream = await fileHandle.createWritable();
          const typeArr = new Uint8ClampedArray(await file.arrayBuffer());
          typeArr.set(searchKey.split('').map(i => i.charCodeAt(0)), emptyLine);
          typeArr.set(insertValue.split('').map(i => i.charCodeAt(0)), emptyLine + searchKey.length + 1);
          WritableFileStream.write(typeArr);
          WritableFileStream.close();
          clearCache();//清数据页缓存，避免脏读
          alert('create success');
          // break;
          return;
        }
        case modeEnum.read: {
          alert('read fail');
          return;
          // break;
        }
        case modeEnum.delete: {
          alert('delete fail');
          return;
        }
      }
    }
    if (nextIOFileName) {
      setLogs((preLog) => {
        return [...preLog, log];
      });
      console.table(cachesList);
      setCachesList(cachesList);
    }
    setSearchValue(nextIOFileName);
  });
  return <>
    <Paper elevation={24} className={style['Paper'] ?? ''}>
      <Paper elevation={24}>
        {(getCachesList() ?? cachesList)?.map(i => {
          return <Paper elevation={24}>
            <h4>{i.index}</h4>
            <p>{i.fileName}.txt</p>
          </Paper>;
        })}
      </Paper>
      <Paper elevation={24}
        className={style['CRUD'] ?? ''}
      >
        <TextField
          label="key"
          onChange={e => setSearchKey(e.target.value)}
          autoFocus
          fullWidth
          required
          type="number"
          inputProps={{
            min: 0,
            max: pow(lineCount, level)
          }}
        />
        <TextField
          label="value"
          onChange={e => setInsertValue(e.target.value)}
          // autoFocus
          fullWidth
        />
        <Button
          size="large"
          variant="contained"
          fullWidth
          onClick={async () => {
            let DirectoryPicker = await getDirectoryPickerFn();
            createFile(DirectoryPicker);
            for (let i = 0; i <= 1; ++i) {
              createFile(DirectoryPicker, i);
            }
            for (let i = 0; i <= 1; ++i) {
              for (let j = 0; j <= 1; ++j)
                createFile(DirectoryPicker, i, j);
            }
          }}>init</Button>
        <Button size="large"
          variant="contained"
          fullWidth
          onClick={onClick.bind(null, modeEnum.create)}
        >Create</Button>
        <Button size="large"
          variant="contained"
          fullWidth
          onClick={onClick.bind(null, modeEnum.read)}
        >Read</Button>
        <Button size="large"
          variant="contained"
          disabled
          fullWidth>Update</Button>
        <Button size="large"
          variant="contained"
          fullWidth
          onClick={onClick.bind(null, modeEnum.delete)}
        >Delete</Button>
        <p>{getSearchValue() ?? searchValue}</p>
      </Paper>
      <Paper elevation={24}>
        {(getLogs() ?? logs).map(i => {
          return <Paper elevation={24}>
            <h5>{i.searchKey}</h5>
            <ul>
              {i.thisLogs.map(i => {
                return <li>{`${i.fileName}.txt (${i.method})`}</li>;
              })}
            </ul>
          </Paper>;
        })}
      </Paper>
    </Paper >
    <Dialog
      open={!Boolean(DirectoryPicker)}
      onAuxClick={initGivePermission}
      onClick={initGivePermission}
      onKeyDown={initGivePermission}
    // onMouseOver={initGivePermission}
    >
      <DialogTitle>请选择文件夹</DialogTitle>
      <DialogActions>
        <Button size="large"
          variant="contained"
          fullWidth
          autoFocus
        >确定</Button>
      </DialogActions>
    </Dialog>
  </>;
}
// switch (chosed) {
//   case initFile.writeOnceTypedArray: {
//     const lineSizeSubArr = new Uint8Array(lineSize).map((_i, ind) => ind + asciiInit);
//     lineSizeSubArr[lineSize - 1] = NL_line_feed;
//     const typeArr = new Uint8Array(fileSize);
//     for (let i = 0; i < fileSize; i += lineSize) {
//       typeArr.set(lineSizeSubArr, i);
//     }
//     await WritableFileStream.write(typeArr);
//     break;
//   }
//   case initFile.writeOnceDataView: {
//     const dataView = new DataView(new ArrayBuffer(fileSize));
//     for (let i = 0; i < fileSize; i += lineSize) {
//       for (let j = 0; j < lineSize - 1; ++j) {
//         dataView.setUint8(j + i, asciiInit + j);
//       }
//       dataView.setUint8(i + lineSize - 1, NL_line_feed);
//     }
//     await WritableFileStream.write(dataView);
//     break;
//   }
//   case initFile.writeOnceString: {
//     let str = '';
//     for (let i = 0; i < fileSize; i += lineSize) {
//       for (let j = 0; j < lineSize - 1; ++j) {
//         str += String.fromCharCode(asciiInit + j);
//       }
//       str += String.fromCharCode(NL_line_feed);
//     }
//     await WritableFileStream.write(str);
//     break;
//   }
//   case initFile.writeManyTypedArray: {
//     const lineSizeSubArr = new Uint8Array(lineSize).map((_i, ind) => ind + asciiInit);
//     lineSizeSubArr[lineSize - 1] = NL_line_feed;
//     for (let i = 0; i < fileSize; i += lineSize) {
//       await WritableFileStream.write({ type: 'write', position: i, data: lineSizeSubArr });
//     }
//     break;
//   }
//   case initFile.writeManyDataView: {
//     const dataView = new DataView(new ArrayBuffer(lineSize));
//     for (let i = 0; i < lineSize - 1; ++i) {
//       dataView.setUint8(i, asciiInit + i);
//     }
//     dataView.setUint8(lineSize - 1, NL_line_feed);
//     for (let i = 0; i < fileSize; i += lineSize) {
//       await WritableFileStream.write({ type: 'write', position: i, data: dataView });
//     }
//     break;
//   }
//   case initFile.writeManyString: {
//     let str = '';
//     for (let i = 0; i < lineSize - 1; ++i) {
//       str += String.fromCharCode(asciiInit + i);
//     }
//     str += String.fromCharCode(NL_line_feed);
//     for (let i = 0; i < fileSize; i += lineSize) {
//       await WritableFileStream.write({ type: 'write', position: i, data: str });
//     }
//     break;
//   }
//   default:
//     console.log('no choice');
// }
/*
<Button
  size="large"
  variant="contained"
  fullWidth
  hidden
  onClick={async () => {
    let DirectoryPicker = getDirectoryPicker();
    if (!DirectoryPicker) {
      DirectoryPicker = await givePermission();
      setDirectoryPicker(DirectoryPicker);
    }
    const fileHandle = await DirectoryPicker.getFileHandle(`${initFile[chosed]}.txt`, {
      create: true
    });
    const file = await fileHandle.getFile();
    const WritableFileStream = await fileHandle.createWritable();
    switch (chosed) {
      case initFile.writeOnceTypedArray: {
        const arrBuffer = await file.arrayBuffer();
        const typeArr = new Uint8Array(arrBuffer);
        for (let i = 0; i < fileSize; i += lineSize) {
          const sliceArr = typeArr.slice(i, i + lineSize);
          typeArr.set(sliceArr.reverse(), i);
        }
        await WritableFileStream.write(typeArr);
        break;
      }
      case initFile.writeOnceDataView: {
        const arrBuffer = await file.arrayBuffer();
        const dataView = new DataView(arrBuffer);
        for (let i = 0; i < fileSize; i += lineSize) {
          for (let j = 0; j < lineSize / 2; ++j) {
            const leftIndex = i + j;
            const rightIndex = i + lineSize - j - 1;
            const left = dataView.getUint8(leftIndex);
            const right = dataView.getUint8(rightIndex);
            dataView.setUint8(leftIndex, right);
            dataView.setUint8(rightIndex, left);
          }
        }
        await WritableFileStream.write(dataView);
        break;
      }
      case initFile.writeManyTypedArray: {
        for (let i = 0; i < fileSize; i += lineSize) {
          const arrBufferSplit = await choiceArrBufferSplit(file, i);
          const typeArr = new Uint8Array(arrBufferSplit);
          await WritableFileStream.write({ type: 'write', position: i, data: typeArr.reverse() });
        }
        break;
      }
      case initFile.writeManyDataView: {
        for (let i = 0; i < fileSize; i += lineSize) {
          const arrBufferSplit = await choiceArrBufferSplit(file, i);
          const dataView = new DataView(arrBufferSplit);
          for (let j = 0; j < lineSize / 2; ++j) {
            const leftIndex = j;
            const rightIndex = lineSize - j - 1;
            const left = dataView.getUint8(leftIndex);
            const right = dataView.getUint8(rightIndex);
            dataView.setUint8(leftIndex, right);
            dataView.setUint8(rightIndex, left);
          }
          await WritableFileStream.write({ type: 'write', position: i, data: dataView });
        }
        break;
      }
      default:
        console.log('no choice');
    }
    await WritableFileStream.close();
  }}>modify</Button>
*/