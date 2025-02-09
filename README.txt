-----------Finance Tracker---------------

Project Overview => Finacne tracker allows you to track your finances accordingly. It is able to calcualte the current budget,
distinguish different types and categories on transactions, and give you valuable data in order to track your finances.

Through the "Goals" page, you are able to set goals and check if you can accomplish them or not.

It is equipped with helpful pie charts, which is able to visualize expenses and incomes, in order to give you a visual presnatation
of your finances.

Can be used by multiple users, able through a user system. Each transaction and goal is linked to a user, which is able to set and edit the budget they start with.

Main Features = > login
                  register
                  set/edit initial budget
                  add/edit/delete transactions
                  add/edit/delete goals
                  basic statistics

File structure.

finance-tracker/
├── backend/
│   ├── node_modules/
│   ├── .env
│   ├── finance.db
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── wsSocket.js
│
└── frontend/
    ├── node_modules/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── AddGoalModal.js
    │   │   ├── EditGoal.js
    │   │   ├── EditInitialBudget.js
    │   │   ├── EditTransactionModal.js
    │   │   ├── Navbar.js
    │   │   ├── ProfileModal.js
    │   │   ├── ProtectedRoutes.js
    │   │   └── TransactionsModal.js
    │   ├── pages/
    │   │   ├── Analytics.js
    │   │   ├── Goals.js
    │   │   ├── Home.js
    │   │   ├── LoginPage.js
    │   │   ├── register.js
    │   │   └── Transactions.js
    │   ├── styles/
    │   │   ├── AddGoalModal.css
    │   │   ├── Analytics.css
    │   │   ├── EditInitialBudget.css
    │   │   ├── Goals.css
    │   │   ├── Home.css
    │   │   ├── LoginPage.css
    │   │   ├── Navbar.css
    │   │   ├── ProfileModal.css
    │   │   ├── TransactionModal.css
    │   │   └── Transactions.css
    │   ├── utils/
    │   │   └── axios.js
    │   ├── App.css
    │   ├── App.js
    │   ├── index.css
    │   ├── index.js
    │   ├── logo.svg
    │   ├── reportWebVitals.js
    │   └── setupTests.js
    ├── package-lock.json
    ├── package.json
    └── README.md
