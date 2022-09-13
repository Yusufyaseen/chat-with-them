package com.chatapp.chatServerApp.model;

import lombok.*;

@Data
public class Message {
    private String message;
    private String senderName;
    private String receiverName;
    private String date;
    private Status status;
}
