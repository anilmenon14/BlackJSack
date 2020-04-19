// Declaring now. Initializing later
var player;

// Small bit of code to check if JS has loaded .
window.onload = () => {
  console.log('Let the games begin...')
};

//declare Player class
class Player {

  constructor(name) {
    this.name = name;
    this.currentGameCards = [];
    this.currentCardValue = { // score1 and score2 in the event of player having a 'soft' hand due to holding an Ace. E.g. Ace and 6 can be '7' or '17'
      score1: null,
      score2: null
    };
    this.outCome = false; // No outcome initially
  }
};

var dealer = new Player('DealerOfBlackJackTable'); // Important - Do not change 'DealerOfBlackJackTable' as name in code since code relies on this distinction

var scoreBoard = {
  player: 0,
  dealer: 0
}

//declare Card class
class Card {
  constructor(cardName, suit) {
    this.cardName = cardName;
    this.suit = suit
  }
  get value() {
    if (typeof this.cardName === 'number') {
      return this.cardName
    } else if (['King', 'Queen', 'Jack'].includes(this.cardName)) {
      return 10;
    } else if (this.cardName === 'Ace') {
      return 'ACE';
    } else { // should not be anything outside above cases
      throw 'Error!'
    }
  }
};

// declare global variable for initial decks. deck needs to be in global scope
var deck = []; // empty when game is not active

function startGame(numDecks = 2, event) {
  // Not every call is from a form. Hence have the below code block to avoid an error
  if (event) {
    event.preventDefault();
  }

  // Initializing inside the function block with variable scopes still being global. Doing so to prevent issues on restart of game
  player = new Player(document.getElementById("player-name").value);
  dealer = new Player('DealerOfBlackJackTable');
  // Setting up name inside game play to display to user
  document.getElementsByClassName("player-card-headers")[0].innerHTML = `${player.name}'s`;
  if (!player.name) { // if user did not provide a name (unlikely to get past screen)
    player = new Player('Player')
  };
  // Hide start button and show all components of the game view
  document.getElementsByClassName("gameplay-container")[0].style.display = "block";
  document.getElementsByClassName("hit-stand-btns")[0].style.display = "block";
  document.getElementsByClassName("hit-stand-btns")[1].style.display = "block";
  document.getElementById("hit-btn").style.display = "block";
  document.getElementById("stand-btn").style.display = "block";
  document.getElementsByClassName("scoreboard")[0].style.display = "block";
  document.getElementsByClassName("commentary-box")[0].style.display = "block";
  document.getElementsByClassName("game-start")[0].style.display = "none";
  document.getElementsByClassName("game-restart")[0].style.display = "none";
  deleteCardsDOMChildren("dealer-hand");
  deleteCardsDOMChildren("player-hand");
  document.getElementById("dealer-score-display").innerHTML = 0;
  document.getElementById("player-score-display").innerHTML = 0;
  disablePlay(false); // i.e. enable play

  deck = []; // ensuring deck is not having any cards currently

  var suitList = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  var cardList = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'King', 'Queen', 'Jack', 'Ace'];

  // building a single deck of 52 cards (minimum deck requirement)
  for (let i = 0; i < suitList.length; i++) {
    for (let j = 0; j < cardList.length; j++) {
      deck.push(new Card(cardList[j], suitList[i]));
    };
  };

  if (numDecks > 4) {
    commentary('Starting Game with 1 deck (Cannot accept over 4 decks)')
    return deck; // starting with single deck
  }

  //if numDecks <= 4, following code will be executed
  var finalDeck = deck;

  while (numDecks > 1) {
    finalDeck = [...finalDeck, ...deck]
    numDecks--;
  }

  deck = finalDeck;
  commentary(`Starting game with ${deck.length/52} decks....`);
  //dealing 2 cards to player and 1 card to the dealer at first
  hitPlayer(player);
  hitPlayer(player);
  hitPlayer(dealer); // only 1 card dealt at this point. Avoiding 2 cards to be dealt to ensure user cannot see value of card in DOM and cheat
  return deck;
};

//Disable Play buttons
function disablePlay(boolean) {
  document.getElementById("hit-btn").disabled = boolean;
  document.getElementById("stand-btn").disabled = boolean;
};

//update commentary into terminal styled view in window
function commentary(text) {
  var curtime = new Date();
  var para = document.createElement("p");
  para.className = "commentary-text"
  para.innerHTML = "-->" + curtime.getHours() + ":" + curtime.getMinutes() + ":" + curtime.getSeconds() + " " + text
  var div = document.getElementsByClassName('commentary-panel')[0];
  div.appendChild(para);
  div.scrollTop = div.scrollHeight; // autoscroll to bottom
};

// OnClick handler callback function for player/dealer 'Hit' action
function hitPlayer(currplayer) {

  if (!deck.length) {
    commentary('No cards in deck!....');
    return 'No cards in deck!'
  };
  // first argument passed to splice is a random position in the existing deck;
  // this should ideally mimic a shuffled deck.
  var pickedCard = deck.splice(Math.floor(Math.random() * deck.length), 1);
  currplayer.currentGameCards.push(pickedCard[0]); // splice returns an array and we are only expecting 1 to be returned. Accessing the object in 0th position
  var div = document.createElement("div");
  div.className = "card"
  var cardInfo = document.createElement("img");
  cardInfo.src = `img/cards_png/${typeof pickedCard[0].cardName === 'number'? String(pickedCard[0].cardName) : String(pickedCard[0].cardName)[0]}${pickedCard[0].suit[0]}.png`
  div.appendChild(cardInfo);
  if (currplayer.name === 'DealerOfBlackJackTable') {
    commentary(`Dealer has drawn ${pickedCard[0].cardName} of ${pickedCard[0].suit}`)
    document.getElementsByClassName("dealer-hand")[0].appendChild(div)
  } else {
    commentary(`${currplayer.name} has drawn ${pickedCard[0].cardName} of ${pickedCard[0].suit}`)
    document.getElementsByClassName("player-hand")[0].appendChild(div)
  }
  if (currplayer.currentGameCards.length > 1) { // Only run this if this is atleast 2 cards drawn. Else game completes through recursive calls to hit and stand
    return checkScore(currplayer);
  }


};

// OnClick handler callback function for player/dealer 'Stand' action
function standPlayer(currplayer) {
  disablePlay(true)
  currplayer.outCome = "Stand"
  return scoreCalc(currplayer);
};



function checkScore(currplayer) {

  var playerName = currplayer.name === 'DealerOfBlackJackTable' ? 'Dealer' : currplayer.name;

  currplayer.aceFirstOccurence = false;
  currplayer.currentCardValue.score1 = 0;
  currplayer.currentCardValue.score2 = 0;

  currplayer.currentGameCards.forEach((card, index) => {

    if (card.value === 'ACE' && currplayer.aceFirstOccurence === false) {
      currplayer.aceFirstOccurence = index; // records where it first met an Ace
      currplayer.currentCardValue.score1 += 1;
      currplayer.currentCardValue.score2 += 11;
    } else if (card.value === 'ACE' && currplayer.aceFirstOccurence !== false) {
      currplayer.currentCardValue.score1 += 1;
      currplayer.currentCardValue.score2 += 1; // Add only 1 since there is no point adding 11 once more as it will end up crossing 21 anyways.
    } else if (typeof card.value === 'number') {
      currplayer.currentCardValue.score1 += card.value;
      currplayer.currentCardValue.score2 += card.value;
    } else {
      throw 'Error in calculating score!'
    }
  })

  //Look for blackjack of score1 or score2
  //look if player has exceeded 21 on score1 AND score 2 , i.e. gone bust

  if ((currplayer.currentCardValue.score1 === currplayer.currentCardValue.score2) && currplayer.currentCardValue.score1 < 21) {
    updateDOMScore(currplayer, `${currplayer.currentCardValue.score1}`);
  } else if ((currplayer.currentCardValue.score1 === currplayer.currentCardValue.score2) && currplayer.currentCardValue.score1 === 21) {
    commentary(`${playerName} has Blackjack!`)
    currplayer.outCome = "BlackJack"
    disablePlay(true) // No need to play further
    updateDOMScore(currplayer, "21(BlackJack)");
    // call function to check if dealer has matched 21 and if player wins
  } else if ((currplayer.currentCardValue.score1 === currplayer.currentCardValue.score2) && currplayer.currentCardValue.score1 > 21) {
    commentary(`${playerName} has Bust!`)
    currplayer.outCome = "Busted"
    disablePlay(true) // Prevent playing further
    updateDOMScore(currplayer, `${currplayer.currentCardValue.score1} (Bust)`);
    // call function to display message and 'restart game' button
  } else if ((currplayer.currentCardValue.score1 !== currplayer.currentCardValue.score2) &&
    (currplayer.currentCardValue.score1 === 21 || currplayer.currentCardValue.score2 === 21)) {
    commentary(`${playerName} has Blackjack!`)
    currplayer.outCome = "BlackJack"
    disablePlay(true); // No need to play further
    updateDOMScore(currplayer, "21(BlackJack)");
  } else if ((currplayer.currentCardValue.score1 !== currplayer.currentCardValue.score2) &&
    ((currplayer.currentCardValue.score1 < 21 && currplayer.currentCardValue.score2 < 21) || currplayer.currentCardValue.score1 < 21 && currplayer.currentCardValue.score2 > 21)) {
    commentary(`${playerName} has Ace/s in hand!`)
    updateDOMScore(currplayer, `${currplayer.currentCardValue.score1}/${currplayer.currentCardValue.score2}`);
  } else if ((currplayer.currentCardValue.score1 !== currplayer.currentCardValue.score2) &&
    currplayer.currentCardValue.score1 > 21 && currplayer.currentCardValue.score2 > 21) {
    commentary(`${playerName} has Bust!`)
    currplayer.outCome = "Busted"
    disablePlay(true) // Prevent playing further
    updateDOMScore(currplayer, `${currplayer.currentCardValue.score1}/${currplayer.currentCardValue.score2} (Bust)`);
    // call function to display message and 'restart game' button
  }

  return scoreCalc(currplayer)

};

function updateDOMScore(currplayer, score) {

  if (currplayer.name === 'DealerOfBlackJackTable') {
    document.getElementById("dealer-score-display").innerHTML = score;
  } else {
    document.getElementById("player-score-display").innerHTML = score;
  }


}



function scoreCalc(currplayer) {

  if (currplayer.name === 'DealerOfBlackJackTable') { // Do this for dealer

    if (currplayer.outCome === "BlackJack") {
      if (player.outCome === "BlackJack" &&
        player.currentGameCards.length === 2 &&
        currplayer.currentGameCards.length > 2) { // Player has blackjack with 2 cards. Dealer needed more cards to get there.
        setTimeout(updateScoreBoardDOM, 2000, "player");
        commentary(`${player.name} has won due to have a 2 card BlackJack!`);
      } else if (player.outCome === "BlackJack" &&
        ((player.currentGameCards.length > 2 &&
          currplayer.currentGameCards.length > 2) || (player.currentGameCards.length === 2 &&
          currplayer.currentGameCards.length === 2))) { // Player and dealer took more than 2 cards to get blackjack. Or both have 2 card Blackjacks
        setTimeout(updateScoreBoardDOM, 2000, "tied");
        commentary('Game is tied! Dealer has matched BlackJack!')
      } else {
        setTimeout(updateScoreBoardDOM, 2000, "dealer");
        commentary('Dealer has won!');
      }
    } else if (currplayer.outCome === "Busted" && player.outCome !== "Busted") {
      setTimeout(updateScoreBoardDOM, 2000, "player");
      commentary(`${player.name} has won!`);
    } else if (currplayer.outCome === "Stand") {

      if (bestScore(dealer) > bestScore(player)) {
        setTimeout(updateScoreBoardDOM, 2000, "dealer");
        commentary('Dealer has won!');
      } else if (bestScore(player) > bestScore(dealer)) {
        setTimeout(updateScoreBoardDOM, 2000, "player");
        commentary(`${player.name} has won!`);
      } else {
        setTimeout(updateScoreBoardDOM, 2000, "tied");
        commentary('Game is tied!')
      }
    } else { // i.e. if currPlayer.outCome === false , need to check if needs to hit or stand
      // dealer will hit if score of dealer is lower than 'stand' value of player
      // Dealer must hit if they are equal and player score is below 17
      if ((bestScore(dealer) < bestScore(player)) || ((bestScore(dealer) < 17) && (bestScore(dealer) === bestScore(player)))) {
        setTimeout(hitPlayer, 1000, dealer);
      } else {
        standPlayer(dealer);
      }
    }
  } else { // Do this for player
    if (currplayer.outCome === "BlackJack" || currplayer.outCome === "Stand") {
      setTimeout(hitPlayer, 1000, dealer);
    } else if (currplayer.outCome === "Busted") {
      document.getElementById("dealer-score-display").innerHTML = "N/A";
      setTimeout(updateScoreBoardDOM, 2000, "dealer");
      commentary('Dealer has won!');

    }
  }

}

// function to get actual score to compare player vs dealer to gauge next steps of game play
function bestScore(currplayer) {
  var {
    score1,
    score2
  } = currplayer.currentCardValue
  if ((score1 > score2 && score1 < 21) || (score1 <= score2 && score2 > 21)) {
    return score1;
  } else {
    return score2
  };

};


// To reset the cards laid out on DOM
function deleteCardsDOMChildren(hand) {
  var e = document.getElementsByClassName(hand)[0];
  var child = e.lastElementChild;
  while (child) {
    e.removeChild(child);
    child = e.lastElementChild;
  }
}

function updateScoreBoardDOM(outcome) {

  // Get scores from main play DOM and display
  document.getElementById("outcome-player-text").innerHTML = "Your score is: " + document.getElementById("player-score-display").innerHTML;
  document.getElementById("outcome-dealer-text").innerHTML = "Dealer's score is: " + document.getElementById("dealer-score-display").innerHTML;

  // Hiding the 'hit' and 'stand' buttons to ensure there is no confusion. 'startGame' will bring it back
  document.getElementById("hit-btn").style.display = "none";
  document.getElementById("stand-btn").style.display = "none";


  if (outcome === "player") {
    scoreBoard.player++;
    document.getElementById("outcome-info-text").innerHTML = "You have won!";
    document.getElementById("outcome-player-text").style.color = "green";
    document.getElementById("outcome-dealer-text").style.color = "red";
    document.getElementById("player-scoreboard").innerHTML = scoreBoard.player;
    document.getElementById("overlay").style.display = "block";
  } else if (outcome === "dealer") {
    scoreBoard.dealer++;
    document.getElementById("outcome-info-text").innerHTML = "You have lost!";
    document.getElementById("outcome-player-text").style.color = "red";
    document.getElementById("outcome-dealer-text").style.color = "green";
    document.getElementById("dealer-scoreboard").innerHTML = scoreBoard.dealer;
    document.getElementById("overlay").style.display = "block";
  } else if (outcome === "tied") {
    document.getElementById("outcome-info-text").innerHTML = "Game is tied!";
    document.getElementById("outcome-player-text").style.color = "";
    document.getElementById("outcome-dealer-text").style.color = "";
    document.getElementById("overlay").style.display = "block";
  }

}

// Overlay screen with message on win/loss/tie

function overlayOff() {
  document.getElementById("overlay").style.display = "none";
  //Restarting button is being made active
  document.getElementsByClassName("game-restart")[0].style.display = "block";
}

// single event handler function to restart game from within overlay
function comboStartGame(numDecks = 2, event) {
  overlayOff();
  startGame(numDecks, event)
}
