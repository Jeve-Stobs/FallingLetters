loadGame();
polyfillKey(); 


function loadGame() {
  var button = document.createElement('button');
  button.textContent = 'Start Game';
  var main = document.getElementById('main');
  main.appendChild(button);
  var rules = document.createElement('p');
  rules.textContent = 'Letters will fall... if you have a keyboard, press the correct key to knock it away before it hits the ground';
  main.appendChild(rules);
  button.addEventListener('click', function startIt(e) {
    main.textContent = '';
    playGame();
  });
}

function playGame(replay) {
  var LETTERS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
  var animations = {'a':[],'b':[],'c':[],'d':[],'e':[],'f':[],'g':[],'h':[],'i':[],'j':[],'k':[],'l':[],'m':[],'n':[],'o':[],'p':[],'q':[],'r':[],'s':[],'t':[],'u':[],'v':[],'w':[],'x':[],'y':[],'z':[]};
  var gameOn = true;
  var timeOffset = 2000; //interval between letters starting, will be faster over time
  var DURATION = 10000;
  var main = document.getElementById('main');
  var header = document.querySelector('header');
  var scoreElement = document.getElementById('score');
  var score = parseFloat(scoreElement.textContent);
  var rate = 1;
  var RATE_INTERVAL = .05; //playbackRate will increase by .05 for each letter... so after 20 letters, the rate of falling will be 2x what it was at the start
  var misses = 0;

  //Create a letter element and setup its falling animation, add the animation to the active animation array, and setup an onfinish handler that will represent a miss. 
  function create() {
    var idx = Math.floor(Math.random() * LETTERS.length);
    var x = (Math.random() * 85) + 'vw';
    var container = document.createElement('div');
    var letter = document.createElement('span');
    var letterText = document.createElement('b');
    letterText.textContent = LETTERS[idx];
    letter.appendChild(letterText);
    container.appendChild(letter);
    main.appendChild(container);
    var animation = container.animate([
      {transform: 'translate3d('+x+',-2.5vh,0)'},
      {transform: 'translate3d('+x+',82.5vh,0)'}
    ], {
      duration: DURATION,
      easing: 'linear',
      fill: 'both'
    });
    
    animations[LETTERS[idx]].splice(0, 0, {animation: animation, element: container});
    rate = rate + RATE_INTERVAL;
    animation.playbackRate = rate;
    
    //If an animation finishes, we will consider that as a miss, so we will remove it from the active animations array and increment our miss count
    animation.onfinish = function(e) {
      var target = container;
      var char = target.textContent;
                                      
      animations[char].pop();
      target.classList.add('missed');
      handleMisses();
    }
  }
  
  //When a miss is registered, check if we have reached the max number of misses
  function handleMisses() {
    misses++;
    var missedMarker = document.querySelector('.misses:not(.missed)');
    if (missedMarker) {
      missedMarker.classList.add('missed');
    } else {
      gameOver();
    }
  }
  
  //End game and show screen
  function gameOver() {
    gameOn = false;
    clearInterval(cleanupInterval);
    getAllAnimations().forEach(function(anim) {
      anim.pause();
    });

    //Could use Web Animations API here, but showing how you can use a mix of Web Animations API and CSS transistions
    document.getElementById('game-over').classList.add('indeed');
  }

  //Periodically remove missed elements, and lower the interval between falling elements
  var cleanupInterval = setInterval(function() {
    timeOffset = timeOffset * 4 / 5;
    cleanup();
  }, 20000);
  function cleanup() {
    [].slice.call(main.querySelectorAll('.missed')).forEach(function(missed) {
      main.removeChild(missed);
    });
  }
  
  //Firefox 48 supports document.getAnimations as per latest spec, Chrome 52 and polyfill use older spec
  function getAllAnimations() {
    if (document.getAnimations) {
      return document.getAnimations();
    } else if (document.timeline && document.timeline.getAnimations) {
      return document.timeline.getAnimations();
    }
    return [];
  }
  
  //On key press, see if it matches an active animating (falling) letter. If so, pop it from active array, pause it (to keep it from triggering "finish" logic), and add an animation on inner element with random 3d rotations that look like the letter is being kicked away to the distance. Also update score.
  function onPress(e) {
    var char = e.key;
    if (char.length === 1) {
      char = char.toLowerCase();
      if (animations[char] && animations[char].length) {
        var popped = animations[char].pop();
        popped.animation.pause();
        var target = popped.element.querySelector('b');
        var degs = [(Math.random() * 1000)-500,(Math.random() * 1000)-500,(Math.random() * 2000)-1000];
        target.animate([
          {transform: 'scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',opacity:1},
          {transform: 'scale(0) rotateX('+degs[0]+'deg) rotateY('+degs[1]+'deg) rotateZ('+degs[2]+'deg)', opacity: 0}
        ], {
          duration: Math.random() * 500 + 850,
          easing: 'ease-out',
          fill: 'both'
        });
        addScore();
        header.textContent += char;
      }
    }
  }
  function addScore() {
    score++;
    scoreElement.textContent = score;
  }
  
  document.body.addEventListener('keypress', onPress);

  //start the letters falling... create the element+animation, and setup timeout for next letter to start
  function setupNextLetter() {
    if (gameOn) {
      create();
      setTimeout(function() {
        setupNextLetter();
      }, timeOffset);
    }
  }
  setupNextLetter();
}

function polyfillKey() {
  if (!('KeyboardEvent' in window) ||
        'key' in KeyboardEvent.prototype) {
    return false;
  }
  
  console.log('polyfilling KeyboardEvent.prototype.key')
  var keys = {};
  var letter = '';
  for (var i = 65; i < 91; ++i) {
    letter = String.fromCharCode(i);
    keys[i] = letter.toUpperCase();
  }
  for (var i = 97; i < 123; ++i) {
    letter = String.fromCharCode(i);
    keys[i] = letter.toLowerCase();
  }
  var proto = {
    get: function (x) {
      var key = keys[this.which || this.keyCode];
      console.log(key);
      return key;
    }
  };
  Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
}