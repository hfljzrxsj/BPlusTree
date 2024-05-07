import { Button, Dialog, DialogActions, DialogTitle, Paper, TextField } from "@mui/material";
import { useGetState, useMemoizedFn } from "ahooks";
import { useCallback } from "react";
import { unstable_batchedUpdates } from "react-dom";
import style from './_index.module.scss';
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import { enumActionName, enumSnackbarAlert, type snackbarAlertAction } from "@/store/SnackBarRuducer";
const { pow } = Math;
function splitIntoPowersOf256 (num: number): ReadonlyArray<number> {
  const result: number[] = [];
  const maxPower = 2; // 256的2次方，即65536  
  let currentNum = num;
  // 从最大的256的幂开始递减  
  for (let power = maxPower; power >= 0; power--) {
    const base = Math.pow(256, power); // 计算当前的256的幂  
    // 计算当前数可以包含多少个当前的256的幂  
    const count = Math.floor(currentNum / base);
    // 如果当前数能包含至少一个当前的256的幂，则将其添加到结果中  
    // if (count > 0) {
    result.push(count);
    currentNum -= count * base; // 从当前数中减去已包含的256的幂  
    // }
    // 如果当前数已经为0，则无需继续循环  
    // if (currentNum === 0) {
    //   break;
    // }
  }
  // 如果currentNum仍然不为0（可能由于浮点运算误差），则将其视为余数并添加到结果中  
  if (currentNum !== 0) {
    result.push(currentNum);
  }
  return result;
}
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
const convertFileName = (joinName: string) => joinName ? `${joinName}_` : '';
const strToUnicode = (str: string | number) => str.toString().split('').map(i => i.charCodeAt(0));
const createFile = async (DirectoryPicker: FileSystemDirectoryHandle, inputLineCount = lineCount, ...indexs: ReadonlyArray<number>) => {
  const joinName = indexs.join('_');
  const valueName = convertFileName(joinName);
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
    if (i < inputLineCount) {
      const key = pow(lineCount, level - indexs.length - 1) * (i + 1) + initNum;
      const arr = strToUnicode(key);
      const value = strToUnicode(`${valueName}${i}`);
      lineSizeSubArr.set(arr, 0);
      lineSizeSubArr.set(value, arr.length + 1);
    }
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
const fileToEachLine = async (file: ArrayBuffer, start: number) => {
  const offset = start * lineSize;
  // const sliceFile = file.slice(offset, offset + lineSize);
  // const blob = new Blob([sliceFile]);
  try {
    // const arrBuffer = await blob.arrayBuffer();
    return new Uint8ClampedArray(file.slice(offset, offset + lineSize));
  } catch (e) {
    console.error(e);
    return new Uint8ClampedArray(lineSize);
  }
};
const isRightSearchKey = (searchKey: number, num: number, i: number) => (searchKey <= num && searchKey > num - pow(lineCount, level - i - 1));
interface Logs {
  readonly searchKey: string;
  readonly thisLogs: Array<{
    readonly method: '内存' | '磁盘';
    readonly fileName: string,
  }>;
  readonly mode: string;
}
// enum mode{
//   create,
//   delete
// }
const getNextFileNameResult = async (file: ArrayBuffer, i: number, j: number, searchKeyNum: number): Promise<{
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
    const value = await getStrOfFileLine(typeArr, key.length + 1);
    return { value };
  }
  return {};
};
enum modeEnum {
  read,
  create,
  delete
}
type fileHandlePromise = () => Promise<FileSystemFileHandle>;
const canCreateOrDelete = (mode: modeEnum, fileHandle: fileHandlePromise, DirectoryPicker: FileSystemDirectoryHandle, k: number, i: number, lastFileHandle: fileHandlePromise[], lastLineIndex: number[]) => (dispatch: Dispatch<snackbarAlertAction>) => {
  return new Promise<boolean>(async (resolve) => {
    if (i === level - 1)
      switch (mode) {
        case modeEnum.create: {
          dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'create fail', [enumSnackbarAlert.severity]: 'error' } });
          // alert('create fail');
          resolve(true);
          return true;
        }
        case modeEnum.delete: {
          // const fileHandle = await DirectoryPicker.getFileHandle(`${nextIOFileName}.txt`, {
          //   create: true
          // });
          const fileH = await fileHandle();
          const file = await fileH.getFile();
          const WritableFileStream = await fileH.createWritable();
          let typeArr = new Uint8ClampedArray(await file.arrayBuffer());
          typeArr.set(new Uint8ClampedArray(lineSize - 1), k * lineSize);
          await WritableFileStream.write(typeArr);
          await WritableFileStream.close();
          let fileName = file.name;
          for (let i = lastFileHandle.length - 1; i >= 0; --i) {
            const last = lastLineIndex[i];
            if (typeArr.every(i => i === 0 || i === 10) && !Number.isNaN(last) && last !== undefined) {
              await DirectoryPicker.removeEntry(fileName);
              const fn = lastFileHandle[i];
              if (!fn) {
                continue;
              }
              const fileHandle = await fn();
              const file = await fileHandle.getFile();
              fileName = file.name;
              const fileArrBuffer = await file.arrayBuffer();
              const WritableFileStream = await (fileHandle).createWritable();
              typeArr = new Uint8ClampedArray(fileArrBuffer);
              typeArr.set(new Uint8ClampedArray(lineSize - 1), last * lineSize);
              await WritableFileStream.write(typeArr);
              await WritableFileStream.close();
            }
          }
          // clearCache();
          // alert('delete success');
          dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'delete success', [enumSnackbarAlert.severity]: 'success' } });
          // break;
          resolve(true);
          return true;
        }
      }
    resolve(false);
    return false;
  });

};
type canCreateOrDeleteParameter = Parameters<typeof canCreateOrDelete>;
const ergodicFile = async (file: ArrayBuffer, i: number, searchKeyNum: number, mode: modeEnum, emptyLine: number): Promise<{
  readonly value?: string;
  readonly tempEmptyLine: number;
  readonly k?: number;
}> => {
  let tempEmptyLine = NaN;
  for (let k = 0; k < lineCount; ++k) {
    const result = await getNextFileNameResult(file, i, k, searchKeyNum);
    if (mode === modeEnum.create)
      if (/* i === level - 1 && */ result.empty) {
        if (Number.isNaN(emptyLine) && Number.isNaN(tempEmptyLine)) {
          tempEmptyLine = k;
        }
      }
    const value = result.value;
    if (value) {
      return { value, tempEmptyLine, k };
    }
  }
  return { tempEmptyLine };
};
const replaceEmptyLine = (emptyLine: number, tempEmptyLine: number) => /* i === level - 1 && */Number.isNaN(emptyLine) && !Number.isNaN(tempEmptyLine);
const initValue = '';
export default function BPlusTree () {
  const dispatch = useDispatch<Dispatch<snackbarAlertAction>>();
  const [DirectoryPicker, setDirectoryPicker, getDirectoryPicker] = useGetState<FileSystemDirectoryHandle>();
  const [cachesList, setCachesList, getCachesList] = useGetState<Array<{
    readonly fileName: string,
    timestamp: number;
    file: File;
    readonly index: number;
  }>>();
  // const clearCache = () => {
  //   setCachesList((cachesList) => {
  //     return cachesList?.filter(i => i.index !== level - 1);
  //   });
  // };
  const [logs, setLogs, getLogs] = useGetState<ReadonlyArray<Logs>>([]);
  const initGivePermission = useMemoizedFn(async () => {
    setDirectoryPicker(await givePermission());
  });
  const [, setSearchKey, getSearchKey] = useGetState(initValue);
  const [searchValue, setSearchValue, getSearchValue] = useGetState('');
  const [insertValue, setInsertValue] = useGetState(initValue);
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
    const splitIntoPowers = splitIntoPowersOf256(searchKeyNum - 1);
    const log: Logs = { searchKey, thisLogs: [], mode: modeEnum[mode] };
    const DirectoryPicker = await getDirectoryPickerFn();
    let nextIOFileName = '';
    let lastFileHandle: fileHandlePromise[] = [];
    let lastLineIndex: number[] = [];
    levelFor: for (let i = 0; i < level; i++) {
      const closureCanCreateOrDelete = (fn: fileHandlePromise, lastFileHandle: fileHandlePromise[], lastLineIndex?: canCreateOrDeleteParameter[6], k?: canCreateOrDeleteParameter[3]) => canCreateOrDelete(mode, fn, DirectoryPicker, k ?? NaN, i, lastFileHandle, lastLineIndex ?? [])(dispatch);
      //从内存中
      // if (false)//禁用缓存
      for (let j = 0; j < cachesList.length; ++j) {
        const thisCache = cachesList[j];
        // const index = thisCache?.index ?? 0;
        if (thisCache && thisCache?.index === i && nextIOFileName === thisCache.fileName) {
          const { file } = thisCache;
          // const blob = new Blob([file]);
          // const arrBuffer = await blob.arrayBuffer();
          // const arrBuffer = await new Promise<ArrayBuffer>((resolve) => {
          //   const reader = new FileReader();
          //   reader.onload = function (evt) {
          //     const target = evt.target?.result;
          //     if (target && (ArrayBuffer.prototype.isPrototypeOf(target) && target instanceof ArrayBuffer && Object.prototype.toString.call(target) === '[object ArrayBuffer]' && target.constructor === ArrayBuffer && typeof target === 'object')) {
          //       resolve(target);
          //     }
          //   };
          //   reader.readAsArrayBuffer(blob);
          // });
          const arrayBuffer = await (async () => {
            try {
              return await file.arrayBuffer();
            } catch (e) {
              console.error(e);
              try {
                const fileHandle = await DirectoryPicker.getFileHandle(file.name);
                const f = await fileHandle.getFile();
                thisCache.file = f;
                return await f.arrayBuffer();
              } catch (e) {
                console.error(e);
                return null;
              }
            }
          })();
          if (!arrayBuffer) {
            break;
          }
          //each line
          const canFind = await ergodicFile(arrayBuffer, i, searchKeyNum, mode, emptyLine);
          const value = canFind.value;
          const tempEmptyLine = canFind.tempEmptyLine;
          const k = canFind.k;
          if (value) {
            if (replaceEmptyLine(emptyLine, tempEmptyLine)) {
              emptyLine = tempEmptyLine;
            }
            const fnClo = (nextIOFileName: string) => async () => { return await DirectoryPicker.getFileHandle(`${nextIOFileName}.txt`); };
            const fn = fnClo(nextIOFileName);
            if (await closureCanCreateOrDelete(fn, lastFileHandle, lastLineIndex, k)) {
              return;
            }
            lastFileHandle.push(fn);
            lastLineIndex.push(k ?? NaN);
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
      //I/O
      const fileHandle = await DirectoryPicker.getFileHandle(`${nextIOFileName}.txt`, {
        create: true
      });
      const file = await fileHandle.getFile();
      const arrBuffer = await file.arrayBuffer();
      //each line
      const canFind = await ergodicFile(arrBuffer, i, searchKeyNum, mode, emptyLine);
      const value = canFind.value;
      const tempEmptyLine = canFind.tempEmptyLine;
      const k = canFind.k;
      if (replaceEmptyLine(emptyLine, tempEmptyLine)) {
        emptyLine = tempEmptyLine;
      }
      if (value) {
        const fn = async () => fileHandle;
        if (await closureCanCreateOrDelete(fn, lastFileHandle, lastLineIndex, k)) {
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
        lastFileHandle.push(fn);
        lastLineIndex.push(k ?? NaN);
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
      //插入值
      if (Number.isNaN(emptyLine)) {
        emptyLine = file.size;
      } else {
        emptyLine *= lineSize;
      }
      switch (mode) {
        case modeEnum.create: {
          if (!insertValue || !searchKey) {
            dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'input require', [enumSnackbarAlert.severity]: 'warning' } });
            // alert('input require');
            return;
          }
          //插入值
          const WritableFileStream = await fileHandle.createWritable();
          const typeArr = await (async () => {
            if (file.size)
              return new Uint8ClampedArray(arrBuffer);
            return new Uint8ClampedArray(fileSize);
          })();
          if (i === level - 1) {
            typeArr.set(strToUnicode(searchKey), emptyLine);
            typeArr.set(strToUnicode(insertValue), emptyLine + searchKey.length + 1);
            typeArr[emptyLine + lineSize - 1] = NL_line_feed;
          } else {
            const powMul = pow(lineCount, level - i - 1);
            const rest = ~~((searchKeyNum - 1) / powMul);
            const searchKey = strToUnicode(((rest + 1) * powMul));
            nextIOFileName = splitIntoPowers.filter((_j, index) => index <= i).join('_');
            typeArr.set(searchKey, emptyLine);
            typeArr.set(strToUnicode(nextIOFileName), emptyLine + searchKey.length + 1);
          }
          await WritableFileStream.write(typeArr);
          await WritableFileStream.close();
          dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'create success', [enumSnackbarAlert.severity]: 'success' } });
          // clearCache();//清数据页缓存，避免脏读
          break;
          // return;
        }
        case modeEnum.read: {
          // alert('read fail');
          dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'read fail', [enumSnackbarAlert.severity]: 'error' } });
          return;
          // break;
        }
        case modeEnum.delete: {
          dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'delete fail', [enumSnackbarAlert.severity]: 'error' } });
          // alert('delete fail');
          return;
        }
      }
      emptyLine = NaN;
    }
    if (nextIOFileName) {
      setLogs((preLog) => {
        return [...preLog, log];
      });
      console.table(cachesList);
      setCachesList(cachesList);
    }
    setSearchValue(nextIOFileName);
    dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'read success', [enumSnackbarAlert.severity]: 'success' } });
  });
  return <>
    <Paper elevation={24} className={style['Paper'] ?? ''}>
      <Paper elevation={24} key={0}>
        {(getCachesList() ?? cachesList)?.map(i => {
          return <Paper elevation={24} key={i.timestamp + i.fileName + i.index}>
            <h4>{i.index}</h4>
            <p>{i.fileName}.txt</p>
          </Paper>;
        })}
      </Paper>
      <Paper elevation={24}
        className={style['CRUD'] ?? ''}
        key={1}
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
            for await (const value of DirectoryPicker.values()) {
              await DirectoryPicker.removeEntry(value.name);
            }
            await createFile(DirectoryPicker, 2);
            for (let i = 0; i <= 1; ++i) {
              await createFile(DirectoryPicker, 2, i);
            }
            for (let i = 0; i <= 1; ++i) {
              for (let j = 0; j <= 1; ++j)
                await createFile(DirectoryPicker, lineCount, i, j);
            }
            dispatch({ type: enumActionName.OPENTRUE, payload: { [enumSnackbarAlert.alertText]: 'init success', [enumSnackbarAlert.severity]: 'success' } });
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
      <Paper elevation={24} key={2}>
        {(getLogs() ?? logs).map((i, index) => {
          return <Paper elevation={24} key={index}>
            <h5>{i.searchKey}</h5>
            <h6>{i.mode}</h6>
            <ul>
              {i.thisLogs.map(i => {
                return <li key={i.fileName}>{`${i.fileName}.txt (${i.method})`}</li>;
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
//     console.info('no choice');
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
        console.info('no choice');
    }
    await WritableFileStream.close();
  }}>modify</Button>
*/