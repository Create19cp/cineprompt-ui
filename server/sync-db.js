const sequelize = require('./config/database');
const models = require('./models');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Sync all models
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to sync the database:', error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase(); 