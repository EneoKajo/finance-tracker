const WebSocket = require('ws');

const initWebSocket = () => {
    const wss = new WebSocket.Server({ port: 3001 });
    console.log('WebSocket Server started on port 3001');

    const clients = new Map();

    wss.on('connection', (ws) => {
        console.log('🟢 New client connected');

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'identify' && data.userId) {
                    clients.set(ws, data.userId);
                    console.log(`👤 Client identified with user ID: ${data.userId}`);
                    ws.send(JSON.stringify({ type: 'connection_test', data: 'Connected successfully!' }));
                }
            } catch (error) {
                console.error('❌ Error processing message:', error);
            }
        });

        ws.on('close', () => {
            console.log('🔴 Client disconnected');
            clients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clients.delete(ws);
        });
    });

    const broadcastToUser = (userId, type, data) => {
        console.log(`📨 Broadcasting ${type} to user ${userId}:`, data);
        clients.forEach((clientUserId, client) => {
            if (clientUserId === userId && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify({ type, data }));
                    console.log(`✅ Successfully sent ${type} to user ${userId}`);
                } catch (error) {
                    console.error(`❌ Error sending ${type} to user ${userId}:`, error);
                    clients.delete(client);
                }
            }
        });
    };

    return {
        broadcastToUser,
        testBroadcast: (userId) => {
            broadcastToUser(userId, 'test', { message: 'Test broadcast successful!' });
        },
        broadcastBudgetUpdate: (userId, budgetData) => {
            console.log(`💰 Broadcasting budget update to user ${userId}`);
            broadcastToUser(userId, 'budget_update', budgetData);
        },
        broadcastTransactionUpdate: (userId, transactionData) => {
            console.log(`💸 Broadcasting transaction update to user ${userId}`);
            broadcastToUser(userId, 'transaction_update', transactionData);
        },
        broadcastGoalUpdate: (userId, goalData) => {
            console.log(`🎯 Broadcasting goal update to user ${userId}`);
            broadcastToUser(userId, 'goal_update', goalData);
        }
    };
};

module.exports = initWebSocket;