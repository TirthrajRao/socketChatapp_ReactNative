import React, { useState, useEffect, useRef } from 'react'
import { View, TouchableOpacity, ListItem, Body,PermissionsAndroid, Text, StyleSheet, ScrollView, Modal, Image, TextInput, ImageBackground, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native';
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from '@react-native-community/async-storage';
import Api from "../service";
import Config from "../config";
import io from "socket.io-client";
import ImagePicker from 'react-native-image-picker';
import RNFetchBlob from 'react-native-fetch-blob';
import FilePickerManager from 'react-native-file-picker';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import VideoPlayer from 'react-native-video-controls';
import { Header } from 'native-base';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import AwesomeAlert from 'react-native-awesome-alerts';
console.disableYellowBox = true;
let value;
let socket;
let theDate;
let profilepic;
let messageDateString;


function useSelectionChange(items) {
  const [selectionMode, setSelectionMode] = useState(null);
  useEffect(() => {
    if (items.filter(i => i.selected).length > 0) {
      setSelectionMode(true);
    } else {
      setSelectionMode(false);
    }
  });
  return selectionMode;
}

function Chat({ route, navigation }) {
  const audioRecorderPlayer = new AudioRecorderPlayer();
  const useMountEffect = (fun) => useEffect(fun, [])
  const [chats, setChats] = useState([])
  const [chatMessage, setChatMessage] = useState('')
  const [selectImage, setSelectImage] = useState(undefined)
  const [visible, setVisible] = useState(false)
  const [typing, setTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const [online, setOnline] = useState(false)
  const [socketMsg, setsocketMsg] = useState('')
  const [recordSecs, setrecordSecs] = useState('');
  const [showAlert , setshowAlert] = useState(false);
  const [ resultrecordedfile, setresultrecordedfile] = useState('');
  const [selectDeleteItems , setselectDeleteItems] = useState(false);
  const [ selectDeleteArray , setselectDeleteArray] = useState([]);
  const scrollViewRef = useRef();
  
  useEffect(() => { 
   
datarenderfunction()
  },[])

  /**
     * check Message created date
     * @param {Number} messageIndex
     */
     const isDifferentDay = (messageIndex) => {
       if (messageIndex == 0) return true;
       // console.log(messageIndex,"+++++++++++++++++++++++++++++++++")
       const d1 = new Date(chats[messageIndex - 1].updatedAt);
       const d2 = new Date(chats[messageIndex].updatedAt);
       console.log("chats===", chats.length)
       return (
         d1.getFullYear() !== d2.getFullYear() ||
         d1.getMonth() !== d2.getMonth() ||
         d1.getDate() !== d2.getDate()
         );
     }
  /**
   * Group Message by Created date
   * @param {Number} messageIndex
   */
   const getMessageDate = (messageIndex) => {
     let dateToday = new Date().toDateString();
     let longDateYesterday = new Date();
     longDateYesterday.setDate(new Date().getDate() - 1);
     let dateYesterday = longDateYesterday.toDateString();
     let today = dateToday.slice(0, dateToday.length - 5);

     let yesterday = dateYesterday.slice(0, dateToday.length - 5);
     const wholeDate = new Date(
       chats[messageIndex].updatedAt.split('T')[0]
       ).toDateString();
     messageDateString = wholeDate.slice(0, wholeDate.length - 5);
     console.log("===========", today, yesterday, "=================", wholeDate, "========", messageDateString);

     if (
       new Date(chats[messageIndex].updatedAt.split('T')[0]).getFullYear() ===
       new Date().getFullYear()
       ) {
       if (messageDateString == today) {
         return "Today";
       } else if (messageDateString == yesterday) {
         return "Yesterday";
       } else {
         console.log("message string", messageDateString)
         return messageDateString;
       }
     } else {
       return wholeDate;
     }
   }




datarenderfunction = async () => {
  value = await AsyncStorage.getItem('userid');
    profilepic = await AsyncStorage.getItem('userprofile');
  socket = io.connect("http://192.168.43.179:5000")
  socket.on('connect', function () {
    console.log("connected=========")

    socket.emit('join', { id: route.params.userclickid });
    if (route.params.userclickid == value) {
      socket.emit('connecteduser', { id: item.receiver });

    }
    socket.on('message', function (data) {

      })
    socket.on("onlineuser", function (data) {
      console.log("data in client side=================", data)
      if (data == route.params.userclickid) {
        console.log("online============================", data);
        setOnline(true)
      } else {
        console.log("ofline====================", data)
        setOnline(false)
      }
    })
    Api.getchats()
    .then((res) => {
      setChats(res)

    })
    .catch(err => {
      console.log(err)
    });
  });

}
const selectionMode = useSelectionChange(chats);

const submitChatMessage = async () => {
  console.log("chatMessage====================", chatMessage);

  socket.emit('chat message', { msg: chatMessage, senderID: value });

  const chatMessages = chats.length != null ? chats.map(chatMessage => {

    if (chatMessage.receiver == value && chatMessage.sender == route.params.userclickid) {
      console.log("call=============if=====status")
      socket.emit("msgStatus", { msgid: chatMessage._id, status: true })
    }
    else {
      socket.emit("msgStatus", { msgid: chatMessage._id, status: false })

    }
  }) : null
  setChatMessage('')
  datarenderfunction()
}
const uploadFile = async (imageName, imageuri) => {
  setshowAlert(false)
  value = await AsyncStorage.getItem('userid');
  console.log("upload file hear=========", value, imageName, imageuri);
  const url = Config.baseurl + "sendFile";

  console.log("call else", url)
  RNFetchBlob.fetch('POST', url, {
    'Content-Type': 'multipart/form-data',
  },
  [
  {
    name: 'sender',
    data: value
  },
  {
    name: 'receiver',
    data: route.params.userclickid
  },
  {
    name: 'sendfile',
    filename: imageName,
    data: RNFetchBlob.wrap(imageuri)
  },

  ]).then((res) => {

    var resp = JSON.parse(res.data);
    console.log("yessss   uploaded", resp);
    submitChatMessage()
  })
  .catch((err) => {
    console.log(err);
  })

}

const launchImageLibrary = () => {
  let options = {
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };
  ImagePicker.launchImageLibrary(options, async (response) => {

    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error);
    } else if (response.customButton) {
      console.log('User tapped custom button: ', response.customButton);
      alert(response.customButton);
    } else {

      console.log("res===============", response, response.fileName);

      await uploadFile(response.fileName, response.uri)
    }
  });
}

const launchCamera = () => {
  let options = {
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };
  ImagePicker.launchCamera(options, async (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error);
    } else if (response.customButton) {
      console.log('User tapped custom button: ', response.customButton);
      alert(response.customButton);
    } else {

      console.log("res===============", response.uri, response.fileName);
      await uploadFile(response.fileName, response.uri)
    }
  });

}
const FilePicker = () => {

  FilePickerManager.showFilePicker(null, async (response) => {
    if (response.didCancel) {
      console.log('User cancelled file picker');
    }
    else if (response.error) {
      console.log('FilePickerManager Error: ', response.error);
    }
    else {
      console.log("response===========", response)
      await uploadFile(response.fileName, response.uri)
    }
  });
}
const showpdf = (filepath, filename) => {

  const url = Config.mediaurl + filepath;
  const localFile = `${RNFS.DocumentDirectoryPath}/` + filename;
  console.log("localFile", localFile)

  const options = {
    fromUrl: url,
    toFile: localFile
  };
  RNFS.downloadFile(options).promise
  .then(() => FileViewer.open(localFile))
  .then(() => {
    console.log("open")
  })
  .catch(error => {
    console.log(error)
  });
}
const showImg = (filepath) => {
  setVisible(true)
  setSelectImage(filepath)
}
const renderchatMessages = chats.map((chatMessage, index) => {
  theDate = new Date(Date.parse(chatMessage.createdAt));
  theDate.toLocaleTimeString()


  // if(isDifferentDay(index) == true){
    //   return(
    //     <View>
    //       <Text>{getMessageDate(index)}</Text>
    //     </View>
    //     )
    // }
    if (chatMessage.receiver == route.params.userclickid && chatMessage.sender == value) {

      if (chatMessage.sendfile.split('.')[1] == 'pdf' ||
        chatMessage.sendfile.split('.')[1] == 'doc' ||
        chatMessage.sendfile.split('.')[1] == 'txt' ||
        chatMessage.sendfile.split('.')[1] == 'wpd' ||
        chatMessage.sendfile.split('.')[1] == 'docx' ||
        chatMessage.sendfile.split('.')[1] == 'mp3' ||
        chatMessage.sendfile.split('.')[1] == 'Info') {

        return (
          <TouchableOpacity 
          onPress={() => onPressmassage(chatMessage)}
          onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
          <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>

          <TouchableOpacity style={styles.sendfile} onPress={() => showpdf(chatMessage.path, chatMessage.sendfile)}>
          <View style={{ backgroundColor: 'white', flexDirection: 'row', padding: 5 }}>
          <Image style={{ width: 25, height: 25 }} source={chatMessage.sendfile.split('.')[1] == 'mp3' || chatMessage.sendfile.split('.')[1] == 'Info' ? require('../assets/audio.png') : chatMessage.sendfile.split('.')[1] == 'pdf' ? require('../assets/pdfimg.png') : require('../assets/file.png')} />
          <Text key={chatMessage} style={styles.pdfText}>{chatMessage.sendfile}</Text>
          </View>


          <View style={{ flexDirection: 'row' }}>
          <View style={{ alignSelf: 'flex-start', flexDirection: 'column' }}>
          <Text key={chatMessage} style={styles.sendertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
          </View>
          <View style={{ alignSelf: 'flex-end', flexDirection: 'column', marginLeft: 'auto' }}>
          <Icon name={"done-all"}
          size={18}
          color={chatMessage.status == false ? "#95AD89" : "#46B6DB"}
          />
          </View>
          </View>

          </TouchableOpacity>
          <Image style={styles.img} source={{ uri: Config.mediaurl + profilepic }} />
          </View>
          </TouchableOpacity>
          )
    } else if (chatMessage.sendfile.split('.')[1] == 'mp4' ||
      chatMessage.sendfile.split('.')[1] == 'mpg' ||
      chatMessage.sendfile.split('.')[1] == 'mp2' ||
      chatMessage.sendfile.split('.')[1] == 'mpeg' ||
      chatMessage.sendfile.split('.')[1] == 'mpe' ||
      chatMessage.sendfile.split('.')[1] == 'mpv') {
      return (
        <TouchableOpacity 
        onPress={() => onPressmassage(chatMessage)}
        onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
        <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
        <TouchableOpacity style={styles.sendfile} onLongPress={() => showpdf(chatMessage.path, chatMessage.sendfile)}>

        <View style={{ flexDirection: 'row', padding: 5, height: 250, width: 250 }}>

        <VideoPlayer
        source={{ uri: Config.mediaurl + chatMessage.path }}
        disableFullscreen={true}
        disableBack={true}
        disableVolume={true}
        paused={true}
        disableSeekbar={false}


        />

        </View>


        <View style={{ flexDirection: 'row' }}>
        <View style={{ alignSelf: 'flex-start', flexDirection: 'column' }}>
        <Text key={chatMessage} style={styles.sendertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
        </View>
        <View style={{ alignSelf: 'flex-end', flexDirection: 'column', marginLeft: 'auto' }}>
        <Icon name={"done-all"}
        size={18}
        color={chatMessage.status == false ? "#95AD89" : "#46B6DB"}
        />
        </View>
        </View>

        </TouchableOpacity>
        <Image style={styles.img} source={{ uri: Config.mediaurl + profilepic }} />
        </View>
        </TouchableOpacity>
        )
    }

    else if (chatMessage.sendfile.split('.')[1] == 'jpeg' ||
      chatMessage.sendfile.split('.')[1] == 'jpg' ||
      chatMessage.sendfile.split('.')[1] == 'png' ||
      chatMessage.sendfile.split('.')[1] == 'gif') {
      return (
        <TouchableOpacity 
        onPress={() => onPressmassage(chatMessage)}
        onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
        <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
        <TouchableOpacity style={styles.sendfile} onPress={() => showImg(chatMessage.path)}>
        <View >

        <Image key={chatMessage} source={{ uri: Config.mediaurl + chatMessage.path }} style={{ width: 250, height: 250 }} />
        </View>
        <View style={{ flexDirection: 'row' }}>
        <View style={{ alignSelf: 'flex-start', flexDirection: 'column' }}>
        <Text key={chatMessage} style={styles.sendertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
        </View>
        <View style={{ alignSelf: 'flex-end', flexDirection: 'column', marginLeft: 'auto' }}>
        <Icon name={"done-all"}
        size={18}
        color={chatMessage.status == false ? "#95AD89" : "#46B6DB"}
        />
        </View>
        </View>

        </TouchableOpacity>
        <Image style={styles.img} source={{ uri: Config.mediaurl + profilepic }} />
        <Modal
        animationType="fade"
        transparent={false}
        visible={visible}
        onRequestClose={() => {
        }}>
        <View >
        <View >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity onPress={() => setVisible(false)} >
        <Icon name="close" color="grey" size={30} />
        </TouchableOpacity>
        </View>
        <View style={{ elevation: 5, padding: 10 }}>
        <Image source={{ uri: Config.mediaurl + selectImage }} style={styles.selectImage} />
        </View>
        </View>
        </View>
        </Modal>

        </View>
        </TouchableOpacity>
        )
  } else {
    return (
      <TouchableOpacity 
      onPress={() => onPressmassage(chatMessage)}
      onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
      <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>

      <View style={styles.sendermsg}>
      <Text key={chatMessage} style={{ marginRight: 50, fontSize: 16 }}>{chatMessage.message}</Text>
      <View style={{ flexDirection: 'row' }}>
      <View style={{ alignSelf: 'flex-start', flexDirection: 'column' }}>
      <Text key={chatMessage} style={styles.sendertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
      </View>
      <View style={{ alignSelf: 'flex-end', flexDirection: 'column', marginLeft: 'auto' }}>
      <Icon name={"done-all"}
      size={18}
      color={chatMessage.status == false ? "#95AD89" : "#46B6DB"}
      />
      </View>
      </View>
      </View>
      <Image style={styles.img} source={{ uri: Config.mediaurl + profilepic }} />
      </View>
      </TouchableOpacity>
      )
  }

} else if (route.params.userclickid == chatMessage.sender && (chatMessage.sender == value || chatMessage.receiver == value)) {
  if (chatMessage.sendfile.split('.')[1] == 'pdf' ||
    chatMessage.sendfile.split('.')[1] == 'doc' ||
    chatMessage.sendfile.split('.')[1] == 'txt' ||
    chatMessage.sendfile.split('.')[1] == 'wpd' ||
    chatMessage.sendfile.split('.')[1] == 'docx' ||
    chatMessage.sendfile.split('.')[1] == 'mp3' ||
    chatMessage.sendfile.split('.')[1] == 'Info') {

    return (
      <TouchableOpacity 
      onPress={() => onPressmassage(chatMessage)}
      onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
      <View style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
      <Image style={styles.img} source={{ uri: route.params.userclickimg }} />


      <TouchableOpacity style={styles.receivefile} onPress={() => showpdf(chatMessage.path, chatMessage.sendfile)}>
      <View style={{ backgroundColor: 'white', flexDirection: 'row', padding: 5 }}>
      <Image style={{ width: 25, height: 25 }} source={chatMessage.sendfile.split('.')[1] == 'mp3' || chatMessage.sendfile.split('.')[1] == 'Info' ? require('../assets/audio.png') : chatMessage.sendfile.split('.')[1] == 'pdf' ? require('../assets/pdfimg.png') : require('../assets/file.png')} />
      <Text key={chatMessage} style={styles.pdfText}>{chatMessage.sendfile}</Text>
      </View>


      <View style={{ flexDirection: 'row' }}>
      <View style={{ alignSelf: 'flex-start', flexDirection: 'column' }}>
      <Text key={chatMessage} style={styles.sendertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
      </View>

      </View>
      </TouchableOpacity>
      </View>
      </TouchableOpacity>
      )
} else if (chatMessage.sendfile.split('.')[1] == 'mp4' ||
  chatMessage.sendfile.split('.')[1] == 'mpg' ||
  chatMessage.sendfile.split('.')[1] == 'mp2' ||
  chatMessage.sendfile.split('.')[1] == 'mpeg' ||
  chatMessage.sendfile.split('.')[1] == 'mpe' ||
  chatMessage.sendfile.split('.')[1] == 'mpv') {
  return (
    <TouchableOpacity 
    onPress={() => onPressmassage(chatMessage)}
    onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
    <Image style={styles.img} source={{ uri: route.params.userclickimg }} />


    <TouchableOpacity style={styles.receivefile} onLongPress={() => showpdf(chatMessage.path, chatMessage.sendfile)}>

    <View style={{ flexDirection: 'row', padding: 5, height: 250, width: 250 }}>

    <VideoPlayer
    source={{ uri: Config.mediaurl + chatMessage.path }}
    disableFullscreen={true}
    disableBack={true}
    disableVolume={true}
    paused={true}

    />

    </View>

    <View style={{ flexDirection: 'row' }}>
    <View style={{ alignSelf: 'flex-start', flexDirection: 'column' }}>
    <Text key={chatMessage} style={styles.sendertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
    </View>

    </View>
    </TouchableOpacity>
    </View>
    </TouchableOpacity>
    )
}
else if (chatMessage.sendfile.split('.')[1] == 'jpeg' ||
  chatMessage.sendfile.split('.')[1] == 'jpg' ||
  chatMessage.sendfile.split('.')[1] == 'png' ||
  chatMessage.sendfile.split('.')[1] == 'gif') {
  return (
    <TouchableOpacity 
    onPress={() => onPressmassage(chatMessage)}
    onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
    <Image style={styles.img} source={{ uri: route.params.userclickimg }} />
    <TouchableOpacity style={styles.receivefile} onPress={() => showImg(chatMessage.path)}>
    <View>


    <Image key={chatMessage} source={{ uri: Config.mediaurl + chatMessage.path }} style={{ width: 250, height: 250 }} />
    </View>
    <Text key={chatMessage} style={styles.receivertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>

    </TouchableOpacity>

    <Modal
    animationType="fade"
    transparent={false}
    visible={visible}
    onRequestClose={() => {
    }}>
    <View >
    <View >
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
    <TouchableOpacity onPress={() => setVisible(false)} >
    <Icon name="close" color="grey" size={30} />
    </TouchableOpacity>
    </View>
    <View style={{ elevation: 5, padding: 10 }}>
    <Image source={{ uri: Config.mediaurl + selectImage }} style={styles.selectImage} />
    </View>
    </View>
    </View>
    </Modal>

    </View>
    </TouchableOpacity>
    )
} else {
  return (
    <TouchableOpacity 
    onPress={() => onPressmassage(chatMessage)}
    onLongPress={() => onLongPressmassage(chatMessage)} style={[chatMessage.selected ? styles.selected : styles.normal]}>

    <View style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
    <Image style={styles.img} source={{ uri: route.params.userclickimg }} />
    <View style={styles.receivermsg}>
    <Text key={chatMessage} style={{ marginRight: 50, fontSize: 16 }}>{chatMessage.message}</Text>
    <Text key={chatMessage} style={styles.receivertime}>{theDate.toLocaleTimeString().split(':')[0] + ":" + theDate.toLocaleTimeString().split(':')[1]}</Text>
    </View>
    </View>
    </TouchableOpacity>

    )
}

}
}

);

  
const toggleSelect = item => {
  setChats(
    chats.map(i => {
      if (item === i) {
        i.selected = !i.selected;
      }
      return i;
    }),
    );
  const itemNumber = chats.filter(item => item.selected).length;
  console.log("irtem========================",itemNumber)
  if(itemNumber == 0){
    setselectDeleteItems(false)
  }else{
    setselectDeleteItems(true)
  }

  chats.map(data => {
    if(data.selected == true) {
      if(selectDeleteArray){
        if(!selectDeleteArray.includes(data._id)){

          selectDeleteArray.push(data._id)
          setselectDeleteArray(selectDeleteArray)
        }
      }
    }else{
      const indexdata = selectDeleteArray.indexOf(data._id)
      console.log("index--------------------------",indexdata)
      if(indexdata > -1 ){

        selectDeleteArray.splice(indexdata, 1);
        setselectDeleteArray(selectDeleteArray)
      }
    }
  })

  console.log("selectDeleteArray=====================",selectDeleteArray)
};


const onPressmassage = item => {
  console.log("==================================",item._id)

  if (selectionMode) {
    toggleSelect(item);

  } else {
    pressItem(item);
  }
};

const onLongPressmassage = item => {

  console.log("==================================",item._id)
  if (selectionMode === false) {
    toggleSelect(item);

  };
}

const pressItem = item => {
  console.log(JSON.stringify(item) + " pressed");
};

const audiopermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permissions for write access',
          message: 'Give permission to your storage to write a file',
          buttonPositive: 'ok',
        },
        );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the storage');
      } else {
        console.log('permission denied');
        return;
      }
    } catch (err) {
      console.warn(err);
      return;
    }
  }
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissions for write access',
          message: 'Give permission to your storage to write a file',
          buttonPositive: 'ok',
        },
        );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
        onStartRecord();
      } else {
        console.log('permission denied');
        return;
      }
    } catch (err) {
      console.warn(err);
      return;
    }
  }
}

const onStartRecord = async () => {


  const path = Platform.select({
    android: 'sdcard/Record' + Math.floor(Math.random() * 10000000000) + '.mp3',
  });
  console.log(path)
  const result = await audioRecorderPlayer.startRecorder(path);
  audioRecorderPlayer.addRecordBackListener((e) => {
    // setrecordSecs(e.current_position)
    // setrecordTime(audioRecorderPlayer.mmssss(
    //   Math.floor(e.current_position),
    //   ),)

    return;
  });
  console.log(result);
};

const onStopRecord = async () => {
  const result = await audioRecorderPlayer.stopRecorder();
  audioRecorderPlayer.removeRecordBackListener();
  setrecordSecs(0)
  setshowAlert(true)
  console.log("result om  stop", result, result.split('/')[4]);
  setresultrecordedfile(result)


};
const startTyping = () => {
  // console.log("typing/......")
  socket.emit('typing', setTyping(true))
}
const deleteMassages = () => {
  console.log("deleteMassages", selectDeleteArray)

  Api.deleteSelectedMassage(selectDeleteArray)
    .then((res) => {
      console.log("delete=======",res.message);

      datarenderfunction()
    })
    .catch(err => {
      console.log(err)
    });

}
// console.log(route.params.userclickname, "is", route.params.userConnection)
return (
  <View style={styles.container}>
  <Header style={{ backgroundColor: '#255E55', height: 75, padding: 5 }}>
  <TouchableOpacity style={{ flexDirection: 'column', flex: 1 }} onPress={() => navigation.navigate('Dashboard')} >

  <Icon
  name={"keyboard-backspace"}
  size={30}
  color="#fff"
  style={{ marginLeft: 8, marginTop: 6 }}
  />
  </TouchableOpacity>
  <View style={{ flexDirection: 'column', flex: 2 }}>
  <Image style={styles.img} source={{ uri: route.params.userclickimg }} />
  </View>
  <View style={{ flexDirection: 'column', flex: 10 }}>
  <Text style={styles.headertext}>{route.params.userclickname}</Text>
  {
    online == false ?
    <Text style={{ color: 'red', fontSize: 12 }}>Offline</Text>
    :
    <Text style={{ color: 'red', fontSize: 12 }}>Online</Text>

  }
  </View>
  {
    selectDeleteItems == true ? 
    <TouchableOpacity onPress={() => deleteMassages()} style={{ alignSelf: 'flex-end', alignContent:'center',flex:2,bottom:20}}>
    <View>

    <Icon
    name={"delete"}
    size={30}
    color="#fff"
    style={{ marginLeft: 8, marginTop: 6 }}
    />
    </View>
    </TouchableOpacity> 
    : null
  }
  </Header>
  <ImageBackground style={styles.imgBackground}
  resizeMode='cover'
  source={require('../assets/bg.jpg')}>

  <View style={{ flex: 6 }}>
  <ScrollView ref={scrollViewRef}
              onContentSizeChange={(contentWidth, contentHeight)=> 
              {scrollViewRef.current.scrollToEnd({animated: true})}}>

  <View>
  {renderchatMessages}
  </View>
  </ScrollView>
  <View style={styles.footer}>


  {
    showButtons == true ?
    <>
    <TouchableOpacity

    style={styles.bottomBtn}
    onPress={() => launchImageLibrary()} >
    <Icon
    name="insert-photo"
    size={25}
    color="white"
    />
    </TouchableOpacity>

    <TouchableOpacity
    style={styles.bottomBtn}
    onPress={() => FilePicker()}>

    <Icon
    name="insert-drive-file"
    size={25}
    color="white"
    />
    </TouchableOpacity>
    </>
    : <TouchableOpacity style={styles.btnSend} onPress={() => setShowButtons(true)}>
    <Icon
    name="keyboard-arrow-right"
    size={25}
    color="white"
    />
    </TouchableOpacity>

  }
  <TouchableOpacity style={styles.inputContainer}>

  <TextInput
  style={styles.inputs}
  autoCorrect={false}
  value={chatMessage}
  placeholder="Type a message"
  multiline={true}
  onChangeText={chatMessage => {
    setChatMessage(chatMessage);
    startTyping()
  }}
  onFocus={() => setShowButtons(false)}
  onKeyPress={() => setShowButtons(false)}
  />

  </TouchableOpacity>
  {
    !showButtons ?
    <>
    {
      chatMessage == '' ?
      <TouchableOpacity style={styles.btnSend} onPressIn={() => audiopermission()} onPressOut={() => onStopRecord()}>

      <Icon
      name="mic"
      size={25}
      color="white"
      />
      </TouchableOpacity> :
      <TouchableOpacity style={styles.btnSend} onPress={() => submitChatMessage()}>

      <Icon
      name="send"
      size={25}
      color="white"
      />
      </TouchableOpacity>
    }
    </>
    : null
  }


  </View>

  <View>
  </View>


  <AwesomeAlert
  show={showAlert}
  showProgress={false}
  title="Send Audio Sms"
  message="I have a message for you!"
  closeOnTouchOutside={true}
  closeOnHardwareBackPress={false}
  showCancelButton={true}
  showConfirmButton={true}
  cancelText="No, delete it "
  confirmText="Yes, send it"
  confirmButtonColor="#DD6B55"
  onCancelPressed={() => {

    setshowAlert(false)
  }}
  onConfirmPressed={() => {
    uploadFile(resultrecordedfile.split('/')[4], resultrecordedfile)

  }}
  />
  </View>
  </ImageBackground>

  </View>
  )
}
export default Chat;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardView: {
    elevation: 3,
    padding: 10,
    margin: 5,
    backgroundColor: "#fff"
  },
  headertext: {
    fontSize: 20,
    color: '#fff',
    marginTop: 10
  },
  footer: {
    flexDirection: 'row',
    height: 'auto',
    paddingHorizontal: 10,
    padding: 5,
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderBottomWidth: 1,
    height: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  inputs: {
    height: 'auto',
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  btnSend: {
    backgroundColor: "#306E5E",
    width: 40,
    height: 40,
    borderRadius: 360,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3
  },
  sendfile: {
    margin: 5,
    elevation: 5,
    padding: 5,
    backgroundColor: '#E0F6C7',
    borderRadius: 5,
    flexDirection: 'column',
    alignSelf: 'flex-end',
    maxWidth: '75%',
    position: 'relative'
  },
  receivefile: {
    margin: 5,
    elevation: 5,
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    maxWidth: '75%',
    position: 'relative'
  },
  sendermsg: {
    margin: 5,
    elevation: 5,
    padding: 10,
    backgroundColor: '#E0F6C7',
    borderRadius: 5,
    flexDirection: 'column',
    alignSelf: 'flex-end',
    maxWidth: '75%',
    position: 'relative'
  },
  receivermsg: {
    margin: 5,
    elevation: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    maxWidth: '75%',
    position: 'relative'
  },
  img: {
    height: 35,
    width: 35,
    borderRadius: 50,
    alignItems: 'center',
    borderColor: '#e7e7e7',
    margin: 5
  },
  imgBackground: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  receivertime: {
    color: '#999999',
    fontSize: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendertime: {
    fontSize: 12,
    color: '#859B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    position: 'absolute',
    bottom: 0,
    right: 5
  },

  bottomBtn: {
    flexDirection: 'column',
    width: 40,
    height: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    backgroundColor: "#306E5E"
  },
  pdfText: {
    marginRight: 50,
    fontSize: 16,
    alignItems: 'center',
    marginLeft: 10,
    fontSize: 15,
    textAlign: 'center'
  },
  selectImage: {
    height: 500,
    width: "100%"
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  selected: {
    backgroundColor: '#ADD2DB',
    marginLeft: 0,
    paddingLeft: 18,
  },
  normal: {
    flex:1
  },


})
