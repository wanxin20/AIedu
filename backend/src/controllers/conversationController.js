const { Conversation, ConversationMessage, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取用户的会话列表
 * GET /api/conversations?page=1&pageSize=20&keyword=xxx
 */
async function getConversationList(req, res) {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      pageSize = 20,
      keyword 
    } = req.query;

    const where = { 
      user_id: userId,
      deleted_at: null 
    };

    // 关键字搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { last_message: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await Conversation.findAndCountAll({
      where,
      offset,
      limit,
      order: [['last_message_at', 'DESC'], ['created_at', 'DESC']]
    });

    const items = rows.map(conversation => ({
      id: conversation.id,
      title: conversation.title,
      cozeConversationId: conversation.coze_conversation_id,
      messageCount: conversation.message_count,
      lastMessage: conversation.last_message,
      lastMessageAt: conversation.last_message_at,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        items
      }
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取会话详情（包含所有消息）
 * GET /api/conversations/:id
 */
async function getConversationDetail(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      where: { 
        id, 
        user_id: userId,
        deleted_at: null 
      },
      include: [
        {
          model: ConversationMessage,
          as: 'messages',
          attributes: ['id', 'sender', 'content', 'suggested_questions', 'created_at'],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在'
      });
    }

    const data = {
      id: conversation.id,
      title: conversation.title,
      cozeConversationId: conversation.coze_conversation_id,
      messageCount: conversation.message_count,
      lastMessage: conversation.last_message,
      lastMessageAt: conversation.last_message_at,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        suggestedQuestions: msg.suggested_questions,
        timestamp: msg.created_at
      }))
    };

    res.json({
      code: 200,
      message: '获取成功',
      data
    });
  } catch (error) {
    console.error('获取会话详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 创建新会话
 * POST /api/conversations
 * Body: { title, cozeConversationId? }
 */
async function createConversation(req, res) {
  try {
    const userId = req.user.id;
    const { title, cozeConversationId } = req.body;

    if (!title) {
      return res.status(400).json({
        code: 400,
        message: '会话标题不能为空'
      });
    }

    const conversation = await Conversation.create({
      user_id: userId,
      title: title.substring(0, 200), // 限制标题长度
      coze_conversation_id: cozeConversationId || null,
      message_count: 0
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: {
        id: conversation.id,
        title: conversation.title,
        cozeConversationId: conversation.coze_conversation_id,
        messageCount: conversation.message_count,
        createdAt: conversation.created_at
      }
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新会话信息
 * PUT /api/conversations/:id
 * Body: { title?, cozeConversationId? }
 */
async function updateConversation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, cozeConversationId } = req.body;

    const conversation = await Conversation.findOne({
      where: { 
        id, 
        user_id: userId,
        deleted_at: null 
      }
    });

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.substring(0, 200);
    if (cozeConversationId !== undefined) updateData.coze_conversation_id = cozeConversationId;

    await conversation.update(updateData);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新会话失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除会话
 * DELETE /api/conversations/:id
 */
async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      where: { 
        id, 
        user_id: userId,
        deleted_at: null 
      }
    });

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在'
      });
    }

    // 软删除
    conversation.deleted_at = new Date();
    await conversation.save();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除会话失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 保存消息到会话
 * POST /api/conversations/:id/messages
 * Body: { sender: 'user' | 'assistant', content, suggestedQuestions? }
 */
async function saveMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { sender, content, suggestedQuestions } = req.body;

    if (!sender || !content) {
      return res.status(400).json({
        code: 400,
        message: '发送者和内容不能为空'
      });
    }

    if (!['user', 'assistant'].includes(sender)) {
      return res.status(400).json({
        code: 400,
        message: '发送者类型无效'
      });
    }

    // 验证会话是否存在且属于当前用户
    const conversation = await Conversation.findOne({
      where: { 
        id, 
        user_id: userId,
        deleted_at: null 
      }
    });

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在'
      });
    }

    // 创建消息
    const message = await ConversationMessage.create({
      conversation_id: id,
      sender,
      content,
      suggested_questions: suggestedQuestions || null
    });

    // 更新会话的最后消息信息和消息数量
    await conversation.update({
      last_message: content.substring(0, 200), // 保存前200个字符
      last_message_at: new Date(),
      message_count: conversation.message_count + 1
    });

    res.status(201).json({
      code: 200,
      message: '保存成功',
      data: {
        id: message.id,
        conversationId: message.conversation_id,
        sender: message.sender,
        content: message.content,
        suggestedQuestions: message.suggested_questions,
        timestamp: message.created_at
      }
    });
  } catch (error) {
    console.error('保存消息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 批量保存消息（用于保存一轮对话）
 * POST /api/conversations/:id/messages/batch
 * Body: { messages: [{ sender, content, suggestedQuestions? }] }
 */
async function saveMessagesBatch(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '消息列表不能为空'
      });
    }

    // 验证会话是否存在且属于当前用户
    const conversation = await Conversation.findOne({
      where: { 
        id, 
        user_id: userId,
        deleted_at: null 
      }
    });

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '会话不存在'
      });
    }

    // 批量创建消息
    const messagesToCreate = messages.map(msg => ({
      conversation_id: id,
      sender: msg.sender,
      content: msg.content,
      suggested_questions: msg.suggestedQuestions || null
    }));

    const createdMessages = await ConversationMessage.bulkCreate(messagesToCreate);

    // 更新会话信息
    const lastMessage = messages[messages.length - 1];
    await conversation.update({
      last_message: lastMessage.content.substring(0, 200),
      last_message_at: new Date(),
      message_count: conversation.message_count + messages.length
    });

    res.status(201).json({
      code: 200,
      message: '批量保存成功',
      data: {
        count: createdMessages.length
      }
    });
  } catch (error) {
    console.error('批量保存消息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getConversationList,
  getConversationDetail,
  createConversation,
  updateConversation,
  deleteConversation,
  saveMessage,
  saveMessagesBatch
};

