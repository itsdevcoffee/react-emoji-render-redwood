import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import replace from "string-replace-to-array";
import emojiRegex from "emoji-regex";

import aliasRegex from "./aliasRegex";

import normalizeProtocol from "./normalizeProtocol";
import unicodeToCodepoint from "./unicodeToCodepoint";

import aliases from "./data/aliases";
import asciiAliases from "./data/asciiAliases";

const unicodeEmojiRegex = emojiRegex();

// using em's we can ensure size matches surrounding font
const style = {
  width: "1em",
  height: "1em",
  margin: "0 .05em 0 .1em",
  verticalAlign: "-0.1em",
};

const asciiToAlias = { ":": ":" };

for (const alias of Object.keys(asciiAliases)) {
  for (const ascii of asciiAliases[alias]) {
    asciiToAlias[ascii] = aliases[alias];
  }
}

function emojiUnicode (emoji) {
  var comp;
  if (emoji.length === 1) {
      comp = emoji.charCodeAt(0);
  }
  comp = (
      (emoji.charCodeAt(0) - 0xD800) * 0x400
    + (emoji.charCodeAt(1) - 0xDC00) + 0x10000
  );
  if (comp < 0) {
      comp = emoji.charCodeAt(0);
  }
  return comp.toString("16");
};


function replaceNotFoundEmoji(match, options) {
  var protocol = (0, _normalizeProtocol2.default)(options.protocol);

  var codepoint = emojiUnicode(match[0]);

  var separator = options.size ? "/" : "";
  var src = "" + protocol + options.baseUrl + options.size + separator + codepoint + "." + options.ext;

  return _react2.default.createElement("img", _extends({
    key: codepoint,
    alt: match[0],
    src: src,
    style: style,
    className: options.className
  }, options.props)); 
}

export async function toArray(text, options = {}, onlyEmojiClassName) {
  const protocol = normalizeProtocol(options.protocol);

  if (options.localSvg) {
	let codepoint1 = replaceAliases(text);
	let codepoint2 = unicodeToCodepoint(replaceAliases(text), removeHelperCharacters);
    // if Emojione we don't want to add helper characters in the URL
    const removeHelperCharacters = options.emojione;
    if (removeHelperCharacters) {
      codepoint2 = codepoint2.replace(/-200d/g, "").replace(/-fe0f/g, "");
	}

	try {
		let importedSvg = await import(`./svg/${codepoint2}.${options.ext}`)
		return (
			<img
				key={codepoint1}
				alt={codepoint1}
				src={importedSvg.default}
				style={style}
				className={options.className}
				{...options.props}
			/>
		);
	} catch (err) {
		console.log(err)
		return (
			<img
				key={codepoint1}
				alt={codepoint1}
				src={codepoint1}
				style={style}
				className={classnames(options.className, onlyEmojiClassName)}
				{...options.props}
			/>
		);
	}

  }

   async function replaceUnicodeEmoji(match, i) {
    if (!options.baseUrl) {
      return (
        <span key={i} style={style} className={options.className}>
          {match}
        </span>
      );
    }

    let codepoint = unicodeToCodepoint(match, removeHelperCharacters);

    // if Emojione we don't want to add helper characters in the URL
    const removeHelperCharacters = options.emojione;
    if (removeHelperCharacters) {
      codepoint = codepoint.replace(/-200d/g, "").replace(/-fe0f/g, "");
    }

    const separator = options.size ? "/" : "";
	const src = `${protocol}${options.baseUrl}${options.size}${separator}${codepoint}.${options.ext}`;

    return (
      <img
        key={i}
        alt={match}
        src={src}
        style={style}
        className={options.className}
        {...options.props}
      />
    );
  }

  function replaceAliases(text) {
    const regex = aliasRegex();
    const textWithEmoji = [];
    let match, pos = 0;

    while (match = regex.exec(text)) {
      const [edgeCase, asciiAlias, fullEmoji] = match.slice(1, 4);
      // possible full emoji like :open_mouth:
      const emoji = aliases[(asciiAlias + fullEmoji).slice(1, -1)];
      if (match.index > pos) {
        // text between matches
        textWithEmoji.push(text.slice(pos, match.index));
      }
      if (edgeCase) {
        // verbatim matched text
        textWithEmoji.push(match[0]);
      } else if (asciiAlias[0] === ":" && fullEmoji && emoji) {
        // full emoji
        textWithEmoji.push(emoji);
      } else {
        // ascii alias or ":"
        textWithEmoji.push(asciiToAlias[asciiAlias]);
        if (fullEmoji) {
          // false positive, "go back" and don't skip that substring
          regex.lastIndex -= fullEmoji.length;
        }
      }
      pos = regex.lastIndex;
    }

    // text after last match (if any)
    textWithEmoji.push(text.slice(pos));
    return textWithEmoji.join("");
  }

  return replace(replaceAliases(text), unicodeEmojiRegex, replaceUnicodeEmoji);
}

export default function Emoji({
  text,
  onlyEmojiClassName,
  options = {},
  className,
  ...rest
}) {
  const [stateOutput, setStateOutput] = useState(true)
  function isOnlyEmoji(output) {
    if (output.length > 3) return false;

    for (let i = 0; i < output.length; i++) {
      if (typeof output[i] === "string") return false;
    }

    return true;
  }

  if (options.localSvg) {
	  useEffect(async () => {
		  let emojiImg = await toArray(text, options, onlyEmojiClassName)
		  setStateOutput(emojiImg)
	  }, [])

	  if (!stateOutput) {
		  return <div>Loading</div>
	  }

	  return (
		  <span {...rest} className={className}>
			  {stateOutput}
		  </span>
	  );
  }

  let output = toArray(text, options);

  if (typeof output[0] === 'string') {
    output = [replaceNotFoundEmoji(output, options)]
  }

  const classes = classnames(className, {
    [onlyEmojiClassName]: isOnlyEmoji(output),
  });

  return (
    <span {...rest} className={classes}>
      {output}
    </span>
  );
}

Emoji.propTypes = {
  text: PropTypes.string,
  props: PropTypes.object,
  onlyEmojiClassName: PropTypes.string,
  options: PropTypes.shape({
    baseUrl: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ext: PropTypes.string,
    className: PropTypes.string,
  }),
};
