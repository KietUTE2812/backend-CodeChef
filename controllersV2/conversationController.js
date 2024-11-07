import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
const createConversation = async (req, res) => {
    const { participants, type } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length < 2) {
        return res.status(400).json({ success: false, message: 'Participants must be an array of at least 2 user IDs' });
    }

    if (type !== 'direct' && type !== 'group') {
        return res.status(400).json({ success: false, message: 'Invalid conversation type' });
    }

    try {
        const conversationId = type === 'direct' ? participants.sort().join('-') : `group-${Date.now()}`;

        const conversation = await Conversation.create({
            conversationId,
            type,
            participants
        });

        res.status(201).json({ success: true, data: conversation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// @desc Get all conversations
// @route GET /api/v1/conversations
// @access Public
const getConversations = async (req, res) => {
    const { page=1, limit=20, ...filters } = req.query;

    try {
        // Nếu `userId` tồn tại, tìm các cuộc hội thoại có `userId` trong mảng `participants`
        if(filters.userId) {
            filters.participants = { $in: [filters.userId] }
            delete filters.userId;
        }
        
        const conversations = await Conversation.find(filters).populate('participants', 'profile').limit(limit).skip((page-1) * limit).sort({ updatedAt: -1 });

        // Dùng Promise.all để gán lastMessage cho từng cuộc hội thoại
        const conversationsWithLastMessage = await Promise.all(
            conversations.map(async (conversation) => {
                // Tìm tin nhắn cuối cùng của cuộc hội thoại
                const lastMessage = await Message.findOne({ conversationId: conversation._id })
                    .sort({ createdAt: -1 })
                    .lean();

                // Gán lastMessage vào conversation và trả về
                return { ...conversation.toObject(), lastMessage };
            })
        );

        res.status(200).json({ success: true, data: conversationsWithLastMessage });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// @desc Get conversation by ID
// @route GET /api/v1/conversations/:conversationId
// @access Public
const getConversationByID = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }
        const messages = await Message.find({ conversationId })
            .sort({ timestamp: -1 })  // Sắp xếp giảm dần để lấy tin nhắn cũ hơn
        res.status(200).json({ success: true, data: {
            conversation,
            messages
        } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// @desc Update conversation
// @route PUT /api/v1/conversations/:conversationId
// @access Private
const updateConversation = async (req, res) => {
    const { id } = req.params;
    const { metadata } = req.body;
    const conversation = await Conversation.findById(id);
    if (!metadata) {
        return res.status(400).json({ success: false, message: 'Metadata is required' });
    }
    if(conversation.participants.includes(req.user._id) || req.user.role === 'admin'){
        try {
            conversation.metadata = metadata; 
            await conversation.save();
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }
            res.status(200).json({ success: true, data: conversation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
        
    }
    else{
        return res.status(401).json({ success: false, message: 'You are not authorized to update this conversation' });
    }
    
}

// @desc Delete conversation
// @route DELETE /api/v1/conversations/:conversationId
// @access Private
const deleteConversation = async (req, res) => {
    const { id } = req.params;

    try {
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }
        if(conversation.participants.includes(req.user._id) || req.user.role === 'admin'){
            conversation.status = 'blocked';
            await conversation.save();
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }
            res.status(200).json({ success: true, data: conversation });
        }
        else{
            return res.status(401).json({ success: false, message: 'You are not authorized to delete this conversation' });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export default { createConversation, getConversations, getConversationByID, updateConversation, deleteConversation }