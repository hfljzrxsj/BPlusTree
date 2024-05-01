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
<Button
  size="large";
variant = "contained";
fullWidth;
hidden;
onClick = { async () => {
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
}}> modify < /Button>;;