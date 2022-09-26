package com.chatapp.chatServerApp.controller;

import com.chatapp.chatServerApp.model.Message;
import com.chatapp.chatServerApp.model.Status;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class chatController {
    // not to use hard-coded topics and go to a dynamic topic.
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;


    // Whenever a user wants to receive a message from this public chatroom then, they need to listen to the topic in @SendTo.

    @MessageMapping("/message") // user sends a message to /app/message
    private Message receivePublicMessage(@Payload Message message) {
        System.out.println(message.getSenderName());
        System.out.println(message.getGroup());
        System.out.println(message.getMessage());
        simpMessagingTemplate.convertAndSend("/chat-room/public/" + message.getGroup(), message);
        return message;
    }

    @MessageMapping("private-message")
    private Message receivePrivateMessage(@Payload Message message) {
        // convertAndSendToUser it will automatically take the /user destination prefix we have set int the config.
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private", message);
        return message;
    }

}
