mergeInto(LibraryManager.library, {
  FocusInputField: function (gameObjectNamePtr) {
    var gameObjectName = UTF8ToString(gameObjectNamePtr);
    var input = document.getElementById('webgl-input');
    input.style.opacity = '1';
    input.style.pointerEvents = 'auto';
    input.focus();

    // Remove existing event listeners
    input.oninput = null;
    input.onblur = null;

    // Set up event listener for input changes
    input.oninput = function () {
      var value = input.value;
      if (typeof unityInstance !== 'undefined' && unityInstance != null) {
        unityInstance.SendMessage(gameObjectName, 'OnInputFieldChanged', value);
      }
    };

    // Handle blur event to hide the input field
    input.onblur = function () {
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      if (typeof unityInstance !== 'undefined' && unityInstance != null) {
        unityInstance.SendMessage(gameObjectName, 'OnInputFieldEndEdit', input.value);
      }
    };
  },
});
