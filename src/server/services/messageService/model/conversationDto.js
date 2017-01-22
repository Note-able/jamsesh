import { userMapper } from '../../userService/model/userDto.js'

export const conversationMapper = (users, conversation) => {
  const messages = conversation.messages.map((dbMessage) => ({
      id: dbMessage.id,
      content: dbMessage.content,
      userId: dbMessage.user_id,
      timeStamp: dbMessage.time_stamp,
      isDeleted: dbMessage.is_deleted,
      conversationId: dbMessage.conversation_id,
  }));
  return { users, id: conversation.conversation.conversation_id, messages };
}

export const conversationsMapper = (conversations) => {
  const conversationMap = conversations.reduce((map, conversation) => {
    const { conversationid, message_id, message_content, message_user_id, ...user } = conversation;
    if (map[conversationid])
      map[conversationid].users.push(user);
    else
      map[conversationid] = { users: [user], lastMessage: { id: message_id, content: message_content, userId: message_user_id } };
    return map;
  }, {});
  return Object.keys(conversationMap).map((id) => {
    return { id, users: conversationMap[id].users, lastMessage: conversationMap[id].lastMessage };
  });
}