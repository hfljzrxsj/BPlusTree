import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { useGetState, useMemoizedFn } from "ahooks";
enum initFile {
  writeOnceTypedArray,
  writeOnceDataView,
  writeOnceString,
  writeManyTypedArray,
  writeManyDataView,
  writeManyString,
}
const fileSize = 16 * 1024;
const lineSize = 64;
const chosed: initFile = initFile.writeOnceTypedArray;
const asciiInit = 33; //!
const NL_line_feed = 10;
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
const choiceArrBufferSplit = async (file: File, i: number) => {
  const choice: number = 0;
  switch (choice) {
    case 0: { //method 1:
      const splieBlob = file.slice(i, i + lineSize);
      const arrBufferSplit = await splieBlob.arrayBuffer();
      return arrBufferSplit;
    }
    case 1: { //method 2:
      const arrBuffer = await file.arrayBuffer();
      const arrBufferSplit = arrBuffer.slice(i, i + lineSize);
      return arrBufferSplit;
    }
    default: {
      return new ArrayBuffer(lineSize);
    }
  }
};
const level = 3;
export default function BPlusTree () {
  const [DirectoryPicker, setDirectoryPicker, getDirectoryPicker] = useGetState<FileSystemDirectoryHandle>();
  const [cachesList, setCachesList] = useGetState<ReadonlyArray<{
    readonly fileName: string,
    readonly timestamp: number;
    readonly buffer: Uint8Array;
    readonly index: number;
  }>>();
  const initGivePermission = useMemoizedFn(async () => {
    setDirectoryPicker(await givePermission());
  });
  return <>
    <Button
      size="large"
      variant="contained"
      fullWidth
      onClick={async () => {
        let DirectoryPicker = getDirectoryPicker();
        if (!DirectoryPicker) {
          DirectoryPicker = await givePermission();
          setDirectoryPicker(DirectoryPicker);
        }
        const fileHandle = await DirectoryPicker.getFileHandle('.txt', {
          create: true
        });
        const WritableFileStream = await fileHandle.createWritable();
        switch (chosed) {
          case initFile.writeOnceTypedArray: {
            const lineSizeSubArr = new Uint8Array(lineSize).map((_i, ind) => ind + asciiInit);
            lineSizeSubArr[lineSize - 1] = NL_line_feed;
            const typeArr = new Uint8Array(fileSize);
            for (let i = 0; i < fileSize; i += lineSize) {
              typeArr.set(lineSizeSubArr, i);
            }
            await WritableFileStream.write(typeArr);
            break;
          }
          case initFile.writeOnceDataView: {
            const dataView = new DataView(new ArrayBuffer(fileSize));
            for (let i = 0; i < fileSize; i += lineSize) {
              for (let j = 0; j < lineSize - 1; ++j) {
                dataView.setUint8(j + i, asciiInit + j);
              }
              dataView.setUint8(i + lineSize - 1, NL_line_feed);
            }
            await WritableFileStream.write(dataView);
            break;
          }
          case initFile.writeOnceString: {
            let str = '';
            for (let i = 0; i < fileSize; i += lineSize) {
              for (let j = 0; j < lineSize - 1; ++j) {
                str += String.fromCharCode(asciiInit + j);
              }
              str += String.fromCharCode(NL_line_feed);
            }
            await WritableFileStream.write(str);
            break;
          }
          case initFile.writeManyTypedArray: {
            const lineSizeSubArr = new Uint8Array(lineSize).map((_i, ind) => ind + asciiInit);
            lineSizeSubArr[lineSize - 1] = NL_line_feed;
            for (let i = 0; i < fileSize; i += lineSize) {
              await WritableFileStream.write({ type: 'write', position: i, data: lineSizeSubArr });
            }
            break;
          }
          case initFile.writeManyDataView: {
            const dataView = new DataView(new ArrayBuffer(lineSize));
            for (let i = 0; i < lineSize - 1; ++i) {
              dataView.setUint8(i, asciiInit + i);
            }
            dataView.setUint8(lineSize - 1, NL_line_feed);
            for (let i = 0; i < fileSize; i += lineSize) {
              await WritableFileStream.write({ type: 'write', position: i, data: dataView });
            }
            break;
          }
          case initFile.writeManyString: {
            let str = '';
            for (let i = 0; i < lineSize - 1; ++i) {
              str += String.fromCharCode(asciiInit + i);
            }
            str += String.fromCharCode(NL_line_feed);
            for (let i = 0; i < fileSize; i += lineSize) {
              await WritableFileStream.write({ type: 'write', position: i, data: str });
            }
            break;
          }
          default:
            console.log('no choice');
        }
        await WritableFileStream.close();
      }}>init</Button>
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
    <Button size="large"
      variant="contained"
      fullWidth

    >Create</Button>
    <Button size="large"
      variant="contained"
      fullWidth>Read</Button>
    <Button size="large"
      variant="contained"
      disabled
      fullWidth>Update</Button>
    <Button size="large"
      variant="contained"
      fullWidth>Delete</Button>
    <Dialog
      open={!Boolean(DirectoryPicker)}
      onAuxClick={initGivePermission}
      onClick={initGivePermission}
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