import React, { useState, useRef, useEffect } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import { Button } from "@mui/material";
import { IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Container, Grid, TextField } from "@material-ui/core";
let stompClient = null;
const ChatRoom = () => {
  const [publicChat, setPublicChat] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const [privateChats, setPrivateChats] = useState(new Map());
  const [userData, setUserData] = useState({
    username: "",
    group: "",
    receiverName: "",
    connected: false,
    message: "",
    date: "",
    // selectedFile: "",
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [publicChat]);

  const handleValue = (e) =>
    setUserData({ ...userData, [e.target.name]: e.target.value });

  const onError = (e) => console.log("Error..");
  const onConnected = (e) => {
    setUserData({ ...userData, connected: true });
    console.log(userData);
    stompClient.subscribe(
      "/chat-room/public/" + userData.group,
      onPublicMessage
    );
    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessage
    );
    userJoin();
  };

  const userJoin = () => {
    var chatMessage = {
      senderName: userData.username,
      group: userData.group,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };
  const onPublicMessage = (payload) => {
    let payloadData = JSON.parse(payload.body);
    // eslint-disable-next-line default-case
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChat.push(payloadData);
        setPublicChat([...publicChat]);
        break;
    }
  };
  const onPrivateMessage = (payload) => {
    let payloadData = JSON.parse(payload.body);
    if (privateChats.get(payloadData.senderName)) {
      privateChats.get(payloadData.senderName).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.senderName, list);
      setPrivateChats(new Map(privateChats));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendValue();
    }
  };
  const handleKeyPressPrivate = (e) => {
    if (e.key === "Enter") {
      sendPrivateValue();
    }
  };

  // const handleFile = async (e) => {
  //   const file = e.target.files[0];
  //   const fileReader = new FileReader();

  //   fileReader.onload = () => {
  //     let buffer = new Uint8Array(fileReader.result);
  //     shareFile(buffer, file.name);
  //   };
  //   fileReader.readAsArrayBuffer(file);
  // };

  // const shareFile = async (buffer, name) => {
  //   let len = buffer.byteLength;
  //   const chunk = await buffer.slice(0, len);
  //   buffer = [];
  //   console.log(chunk);
  //    setUserData({
  //      ...userData,
  //      selectedFile: chunk,
  //    });
  //   sendValue(chunk);
  // };

  const sendValue = () => {
    console.log(userData.selectedFile);
    if (!userData.message) return;
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        group: userData.group,
        message: userData.message,
        status: "MESSAGE",
        date: new Date().toLocaleString(),
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateValue = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        receiverName: tab,
        message: userData.message,
        status: "MESSAGE",
        date: new Date().toLocaleString(),
      };
      if (userData.username !== tab) {
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const registerUser = () => {
    let sock = new SockJS("http://localhost:8080/connect");
    stompClient = over(sock);
    stompClient.connect({}, onConnected, onError);
  };
  return (
    <Container>
      {userData.connected ? (
        <Grid
          container
          justifyContent="space-between"
          spacing={3}
          alignItems="stretch"
          direction="row"
        >
          <Grid item xs={12} sm={3} md={3} lg={3} className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                Chatroom
              </li>
              {[...privateChats.keys()].map((name, index) => (
                <li
                  onClick={() => {
                    setTab(name);
                  }}
                  className={`member ${tab === name && "active"}`}
                  key={index}
                >
                  {name}
                </li>
              ))}
            </ul>
          </Grid>

          {tab === "CHATROOM" && (
            <Grid item xs={12} sm={9} md={9} lg={9}>
              <ul className="chat-messages">
                {publicChat.map((chat, index) => (
                  <li
                    className={`message ${
                      chat.senderName === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    {chat.senderName === userData.username && (
                      <div className="message-date">{chat.date}</div>
                    )}
                    <div className="message-data">{chat.message}</div>

                    {chat.senderName === userData.username && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                    {chat.senderName !== userData.username && (
                      <div className="message-date">{chat.date}</div>
                    )}
                  </li>
                ))}
                <div ref={messagesEndRef} />
              </ul>

              <div className="send-message">
                <TextField
                  type="text"
                  name="message"
                  variant="outlined"
                  className="input-message"
                  placeholder="enter the message"
                  value={userData.message}
                  onKeyPress={handleKeyPress}
                  onChange={handleValue}
                />
                {/* &nbsp;
                <input
                  name="file"
                  type="file"
                  id="take-file"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
                <label htmlFor="take-file">
                  <IconButton
                    color="default"
                    aria-label="upload picture"
                    className="file"
                    component="span"
                  >
                    <AttachFileIcon />
                  </IconButton>
                </label> */}
                <Button
                  variant="contained"
                  className="send-button"
                  disabled={userData.message === "" && true}
                  onClick={() => sendValue(0)}
                >
                  send
                </Button>
              </div>
            </Grid>
          )}
          {tab !== "CHATROOM" && (
            <Grid item xs={12} sm={9} md={9} lg={9}>
              <ul className="chat-messages">
                {[...privateChats.get(tab)].map((chat, index) => (
                  <li
                    className={`message ${
                      chat.senderName === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    {chat.senderName === userData.username && (
                      <div className="message-date">{chat.date}</div>
                    )}
                    <div className="message-data">{chat.message}</div>

                    {chat.senderName === userData.username && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                    {chat.senderName !== userData.username && (
                      <div className="message-date">{chat.date}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <TextField
                  type="text"
                  name="message"
                  variant="outlined"
                  className="input-message"
                  placeholder="enter the message"
                  value={userData.message}
                  onKeyPress={handleKeyPressPrivate}
                  onChange={handleValue}
                />
                &nbsp;
                <Button
                  variant="contained"
                  className="send-button"
                  disabled={userData.message === "" && true}
                  onClick={sendPrivateValue}
                >
                  send
                </Button>
              </div>
            </Grid>
          )}
        </Grid>
      ) : (
        <div className="register">
          <TextField
            className="usr"
            variant="outlined"
            placeholder="Enter your username"
            value={userData.username}
            name="username"
            onChange={handleValue}
          />
          &nbsp;
          <TextField
            className="usr"
            variant="outlined"
            placeholder="Enter your group"
            value={userData.group}
            name="group"
            onChange={handleValue}
          />
          &nbsp;
          <Button
            variant="contained"
            disabled={userData.username === "" && true}
            className="btn"
            onClick={registerUser}
          >
            Connect
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ChatRoom;
