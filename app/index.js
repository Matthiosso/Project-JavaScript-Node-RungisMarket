'use strict';

/** Librairies unused: */
// const Promise = require('bluebird');
// const fs = require('fs');
// Promise.promisifyAll(fs);

/** Librairies used: */
const chalk = require('chalk');   // For colorful display in console
const EventEmitter = require('events').EventEmitter;  // To create/handle events

/** Constants used in the program */
const nbOfClient = 3;
const maxRefillingTime = 1151;
const minRefillingTime = 150;
const maxCookingTime = 501;
const minCookingTime = 50;
const maxToleranceTime = 401;
const minToleranceTime = 100;


//CLOCK
/**
 * Class used to deal with the Time in this universe
 */
class Clock {
  /**
   * Constructs the clock
   * @param {World} world - universe of the simulation
   */
  constructor(world) {
    this.world = world;
    const interv = setInterval(() =>
      this.world.ev.emit('hour', i++ % 24), 1000);
    let i = 0;
    this.actualHour = 0;
    this.world.ev.on('hour', (hour) => this.actualHour = hour);
    this.world.ev.on('hour', (hour) =>
      console.log(chalk.bold.cyan(`The hour is ${hour}`)));
    setTimeout(() => clearInterval(interv), 48000);
    this.world.ev.on('hour', (hour) => this.dailyCheck(hour));
  }

  /**
   * Checking daily (hour 0) each buildings and display scores
   * @param hour
   */
  dailyCheck(hour) {
    if (hour > 0) {
      for (let index = 0; index < this.world.listOfRestaurant.length; index++) {
        if (this.world.listOfRestaurant[index].isAvailable(hour)) {
          this.world.listOfRestaurant[index].openHours++;
        }
      }
    } else {
      this.world.final();
      for (let index = 0; index < this.world.listOfRestaurant.length; index++) {
        this.world.listOfRestaurant[index].openHours = 0;
        this.world.listOfRestaurant[index].score = 0;
      }
    }
  }
}

//STOCK
/**
 * Class used to stock ingredients
 */
class Stock {
  /**
   * Constructs the stock
   * @param {Number} tomato - ingredient
   * @param {Number} salad - ingredient
   * @param {Number} noodle - ingredient
   * @param {Number} potato - ingredient
   * @param {Number} bread - ingredient
   * @param {Number} chicken - ingredient
   * @param {Number} fish - ingredient
   * @param {Number} beef - ingredient
   */
  constructor(tomato, salad, noodle, potato, bread, chicken, fish, beef) {
    this.listOfStock = {};
    this.fill(tomato, salad, noodle, potato, bread, chicken, fish, beef);
  }

  /**
   * Fill the stock
   * @param {Number} tomato - ingredient
   * @param {Number} salad - ingredient
   * @param {Number} noodle - ingredient
   * @param {Number} potato - ingredient
   * @param {Number} bread - ingredient
   * @param {Number} chicken - ingredient
   * @param {Number} fish - ingredient
   * @param {Number} beef - ingredient
   * @returns {boolean} inform that the function has succeeded
   */
  fill(tomato, salad, noodle, potato, bread, chicken, fish, beef) {
    this.listOfStock.tomato = tomato;
    this.listOfStock.salad = salad;
    this.listOfStock.noodle = noodle;
    this.listOfStock.potato = potato;
    this.listOfStock.bread = bread;
    this.listOfStock.chicken = chicken;
    this.listOfStock.fish = fish;
    this.listOfStock.beef = beef;
    return true;
  }

  /**
   * Check if at least one of all recipes in the list is doable.
   * @param listOfRecipes - list of recipes
   * @returns {boolean} informs if the list contains a doable recipe.
   */
  checkRecipe(listOfRecipes) {
    for (let index = 0; index < listOfRecipes.length; index++) {
      if (this.listOfStock[listOfRecipes[index]] < 1) {
        console.log(chalk.red('The ingredient ' + listOfRecipes[index] +
          ' isn\'t available.'));
        return false;
      }
    }
    return true;
  }

  /**
   * Do one recipe among the list of recipes and delete the ingredients used.
   * @param listOfRecipes - list of recipes
   * @returns {boolean} informs if the list contains a doable recipe.
   */
  doRecipe(listOfRecipes) {
    if (this.checkRecipe(listOfRecipes)) {
      for (let index = 0; index < listOfRecipes.length; index++) {
        console.log(chalk.blue('The ingredient ' + listOfRecipes[index] +
          ' is being used.'));
        this.listOfStock[listOfRecipes[index]]--;
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * To display the actual stock
   * @returns {string}
   */
  toString() {
    let temp = '\n';
    for (let food in this.listOfStock) {
      if (food !== '') {
        temp += (food + ' : ' + this.listOfStock[food] + '\n');
      }
    }
    return temp;
  }
}

//MARKET
/**
 * Class for the Rungis Market
 */
class RungisMarket {
  /**
   * Constructs the Rungis Market
   * @param {World} world - universe of the simulation
   */
  constructor(world) {
    this.world = world;
    this.openingTime = 5;
    this.closingTime = 14;
    this.name = 'Rungis Market';
    this.stock = new Stock(1, 1, 1, 1, 1, 1, 1, 1);
    // stock infini => ne décrémente jamais
    this.world.ev.on('hour', (hour) => this.isAvailable(hour));
  }

  /**
   * Fills the restaurant stock
   * @param restaurant - restaurant which needs a refill.
   */
  fillRestaurantStock(restaurant) {
    console.log(chalk.blue('The restaurant ' + restaurant.name +
      ' is going to Rungis to refill its stock.'));
    setTimeout(restaurant.fillStock(1, 1, 1, 1, 1, 1, 1, 1),
      Math.floor(Math.random() * (maxRefillingTime -
        minRefillingTime)) + minRefillingTime);
  }

  /**
   * Check if the Rungis Market is opened.
   * @param hour - Actual hour
   * @returns {boolean} informs if it is opened.
   */
  isAvailable(hour) {
    if ((hour >= this.openingTime) &&
      (hour < this.closingTime)) {
      console.log(chalk.bold.green(this.name + ' is opened !'));
      return true;
    } else {
      console.log(chalk.bold.red(this.name + ' is closed.'));
      return false;
    }
  }
}


//RESTAURANT
/**
 * Class for the restaurants
 */
class Restaurant {
  /**
   * Construct the Restaurant
   * @param {Number} openingTime - opening time of the Restaurant
   * @param {Number} closingTime - closing time of the Restaurant
   * @param {World} world - universe of the simulation
   * @param {String} name - the Restaurant's name
   */
  constructor(world, openingTime, closingTime, name) {
    this.world = world;
    this.openingTime = openingTime;
    this.closingTime = closingTime;
    this.name = name;
    this.isOpen = false;
    this.isRefilling = false;
    this.stock = new Stock(1, 1, 1, 1, 1, 1, 1, 1);
    this.listOfRecipes = [];
    this.score = 0;
    this.openHours = 0;
    for (let index = 4; index < arguments.length; index++) {
      this.listOfRecipes.push(arguments[index]);
    }
  }

  /**
   * To finish the cooking time
   * @param toleranceClient - the tolerance time of the client
   * @returns {boolean} - informs that the cooking is finished
   */
  finishCooking(toleranceClient) {
    let timeCooking = Math.floor(Math.random() * (maxCookingTime -
        minCookingTime)) + minCookingTime;
    setTimeout(console.log(chalk.bold.blue('The stock of the restaurant ' +
      this.name + ' is now : ' + this.stock)), timeCooking);
    if (timeCooking < (toleranceClient - 100)) {
      this.score += 2;
    } else if (timeCooking < (toleranceClient + 50)) {
      this.score += 1;
    }
    return true;
  }

  /**
   * To start the cooking time
   * @param client - client to cook for
   * @returns {boolean} - informs that the client has received his food.
   */
  cooking(client) {
    console.log(chalk.bold.green(this.name + ' is cooking.'));
    if (this.finishCooking(client.tolerance)) {
      console.log(chalk.bgGreen(client.name + ' has received his food.'));
      return true;
    }
  }

  /**
   * To select the recipe
   * @param client - client to cook for
   * @returns {boolean} - informs that the recipe has been chosen.
   */
  selectRecipe(client) {
    for (let index = 0; index < this.listOfRecipes.length; index++) {
      if (this.stock.doRecipe(
          this.listOfRecipes[index])) {
        return this.cooking(client);
      }
    }
    return false;
  }

  /**
   * To start the order of the client
   * @param client - client to cook for
   * @returns {boolean} - informs that the client has been served.
   */
  servingClient(client) {
    if (this.checkAllRecipes()) {
      return this.selectRecipe(client);
    } else {
      return false;
    }
  }

  /**
   * For asking to refill at the Rungis Market
   */
  reFill() {
    if (!this.isRefilling) {
      this.isRefilling = true;
      console.log(chalk.yellow(this.name + ' wants to refill in Rungis.'));
      if (this.world.market.isAvailable(this.world.mainClock.actualHour)) {
        this.world.market.fillRestaurantStock(this);
      }
    }
  }

  /**
   * To check if the stock needs to be refilled.
   * @returns {boolean} - informs if the refill has been launched.
   */
  stockIsEmpty() {
    if (!this.checkAllRecipes()) {
      console.log(chalk.yellow(this.name + ' needs more stock.'));
      if (this.isOpen) {
        this.isOpen = false;
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check if the Rungis Market is opened.
   * @param hour - Actual hour
   * @returns {boolean} informs if it is opened.
   */
  isAvailable(hour) {
    if ((hour >= this.openingTime) &&
      (hour < this.closingTime)) {
      if (!this.stockIsEmpty()) {
        console.log(chalk.green(this.name + ' is opened !'));
        this.isOpen = true;
        return true;
      } else {
        return false;
      }
    } else {
      console.log(chalk.red(this.name + ' is closed.'));
      this.isOpen = false;
      return false;
    }
  }

  /**
   * Check all recipes to see if at least one can be done.
   * @returns {boolean} - informs that one recipe can be done.
   */
  checkAllRecipes() {
    let nbOfRecipeAvailable = 0;
    for (let index = 0; index < this.listOfRecipes.length; index++) {
      if (this.stock.checkRecipe(this.listOfRecipes[index])) {
        nbOfRecipeAvailable++;
      }
    }
    if (nbOfRecipeAvailable > 0) {
      return true;
    } else {
      if (this.isOpen) {
        this.isOpen = false;
        if (!this.isRefilling) {
          this.reFill();
        }
      }
      return false;
    }
  }

  /**
   * To fill the restaurant's stock
   * @param {Number} tomato - ingredient
   * @param {Number} salad - ingredient
   * @param {Number} noodle - ingredient
   * @param {Number} potato - ingredient
   * @param {Number} bread - ingredient
   * @param {Number} chicken - ingredient
   * @param {Number} fish - ingredient
   * @param {Number} beef - ingredient
   */
  fillStock(tomato, salad, noodle, potato, bread, chicken, fish, beef) {
    if (this.stock.fill(tomato, salad, noodle, potato,
        bread, chicken, fish, beef)) {
      console.log(chalk.blue('The restaurant ' + this.name +
        ' has finished to refill its stock:' + this.stock));
      this.isRefilling = false;
      if ((this.world.mainClock.actualHour >= this.openingTime) &&
        (this.world.mainClock.actualHour < this.closingTime)) {
        this.isOpen = true;
      }
    }
  }
}


//CLIENT
/**
 * Class for the clients
 */
class Client {
  /**
   * Constructs the client
   * @param {World} world - universe of the simulation
   * @param {String} name - the Client's name
   * @param {Number} index - the Client's index
   */
  constructor(world, name, index) {
    this.world = world;
    this.name = name;
    this.index = index;
    this.tolerance = Math.floor(Math.random() * (maxToleranceTime -
        minToleranceTime)) + minToleranceTime;
  }

  /**
   * For the client to go to the restaurant
   * @param restaurant - restaurant where the client is going
   * @returns {boolean} - informs that the client has gone to the restaurant
   */
  goToRestaurant(restaurant) {
    if (restaurant.isOpen) {
      console.log(chalk.bgGreen(this.name +
        ' can eat in ' + restaurant.name + '.'));
      return restaurant.servingClient(this);
    } else {
      console.log(chalk.bold.gray(this.name +
        ' has to go to another restaurant as ' +
        restaurant.name + ' is closed.'));
      return false;
    }
  }
}


//MAIN
/**
 * Class to create the world where the simulation will be taking place.
 */
class World {
  /**
   * Constructs the World
   */
  constructor() {
    this.ev = new EventEmitter();
    this.mainClock = new Clock(this);
    this.market = new RungisMarket(this);

    this.listOfRestaurant = this.generateRestaurants();
    this.listOfClient = this.generateClients();
  }

  /**
   * To generate all the restaurants
   * @returns {Array} - The list of the restaurants
   */
  generateRestaurants() {
    let listOfRestaurant = [];
    let mcDoRestaurant = new Restaurant(this, 8, 23, 'McDonald\'s',
      ['tomato', 'salad', 'chicken'], ['chicken', 'potato']);
    let eastMamma = new Restaurant(this, 8, 23, 'East Mamma',
      ['noodle', 'tomato', 'beef'], ['noodle', 'chicken', 'salad']);
    let chineseRestaurant = new Restaurant(this, 8, 23, 'Chinese Food',
      ['noodle', 'salad', 'beef']);
    listOfRestaurant.push(mcDoRestaurant, eastMamma, chineseRestaurant);
    return listOfRestaurant;
  }

  /**
   * To generate all the clients
   * @returns {Array} - The list of the clients
   */
  generateClients() {
    let listOfClient = [];
    for (let index = 0; index < nbOfClient; index++) {
      listOfClient[index] = new Client(this, `Client ${index}`, index);
      console.log(chalk.cyan('Creation of ' + listOfClient[index].name));
    }
    return listOfClient;
  }

  /**
   * To choose a random restaurant among the list.
   * @returns {*} - The restaurant selected
   */
  chooseRestaurant() {
    return this.listOfRestaurant[Math.floor(Math.random() *
      this.listOfRestaurant.length)];
  }

  /**
   * To send the client to a restaurant (and repeat until he ate)
   * @param client - the client to send
   */
  sendClientToRestaurant(client) {
    if (!client.goToRestaurant(this.chooseRestaurant())) {
      setTimeout(
        () => clearInterval(this.sendClientToRestaurant(client)), 100);
    } else {
      console.log(chalk.blue.bgWhite(client.name + ' has well eaten.'));
      // this.listOfClient = this.listOfClient.slice(client.index);
      this.listOfClient[client.index] = null;
      console.log(chalk.bold.red(client.name + ' is being deleted.'));
      this.listOfClient = this.listOfClient.slice(client.index);
    }
  }

  /**
   * To start the simulation in the world
   */
  start() {
    for (let index = 0; index < nbOfClient; index++) {
      this.sendClientToRestaurant(this.listOfClient[index]);
    }
  }

  /**
   * The final function to show the scores and the winner
   */
  final() {
    let winner = this.listOfRestaurant[0];
    for (let index = 0; index < this.listOfRestaurant.length; index++) {
      this.listOfRestaurant[index].score *=
        (24 - this.listOfRestaurant[index].openHours);
      if (this.listOfRestaurant[index].score > winner.score) {
        winner = this.listOfRestaurant[index];
      }
    }
    console.log(chalk.magenta('The score of each restaurant is : '));
    for (let index = 0; index < this.listOfRestaurant.length; index++) {
      console.log(chalk.bold.magenta(this.listOfRestaurant[index].name + ' : ' +
        this.listOfRestaurant[index].score));
    }
    console.log(chalk.bold.bgMagenta('And the Winner is... ' + winner.name) +
    '\n\n\n');
  }
}


/**
 * Create an object World
 * @type {World}
 */
const world = new World();
/**
 * Starting the World simulation '2 hours' after its creation
 */
setTimeout(() => clearInterval(world.start()), 2000);
