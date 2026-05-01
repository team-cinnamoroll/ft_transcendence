// Show UI (hidden) so we can use Web APIs (WebSocket in ui.html)
figma.showUI(__html__, { visible: false });

// ---------- Bridge ----------
figma.ui.onmessage = async (msg) => {
  const { id, action, args } = msg || {};
  try {
    const result = await handleAction(action, args || {});
    reply(id, Array.isArray(result) ? { ok: true, data: result } : Object.assign({ ok: true }, result || {}));
  } catch (e) {
    reply(id, { ok: false }, e instanceof Error ? e.message : String(e));
  }
};
function reply(replyTo, result, error) {
  figma.ui.postMessage({ replyTo, result, error });
}
const page = () => figma.currentPage;

// ---------- Utilities ----------
function serializePaints(paints) {
  if (!paints || typeof paints.length !== "number") return [];
  var arr = [];
  for (var i = 0; i < paints.length; i++) { arr.push(paints[i]); }
  return arr.map(function(p) {
    var base = { type: p.type, visible: p.visible !== false, opacity: p.opacity != null ? p.opacity : 1, blendMode: p.blendMode };
    if (p.type === "SOLID" && p.color) {
      base.hex = rgbToHex(p.color);
    } else if (p.type && p.type.indexOf("GRADIENT") === 0 && p.gradientStops) {
      base.gradientStops = p.gradientStops.map(function(s) {
        var stop = {
          position: s.position,
          hex: s.color ? rgbToHex(s.color) : null,
          opacity: s.color && s.color.a != null ? s.color.a : 1
        };
        if (s.boundVariables) {
          var sbv = {};
          var stopBVKeys = ["color"];
          for (var sk in s.boundVariables) {
            var sb = s.boundVariables[sk];
            if (sb && sb.id) {
              sbv[sk] = { type: sb.type, id: sb.id };
              try {
                var sv = figma.variables.getVariableById(sb.id);
                if (sv) { sbv[sk].name = sv.name; sbv[sk].resolvedType = sv.resolvedType; }
              } catch (_) {}
            }
          }
          for (var si = 0; si < stopBVKeys.length; si++) {
            var spk = stopBVKeys[si];
            if (!(spk in sbv)) {
              try {
                var spb = s.boundVariables[spk];
                if (spb && spb.id) {
                  sbv[spk] = { type: spb.type, id: spb.id };
                  var spv = figma.variables.getVariableById(spb.id);
                  if (spv) { sbv[spk].name = spv.name; sbv[spk].resolvedType = spv.resolvedType; }
                }
              } catch (_) {}
            }
          }
          if (Object.keys(sbv).length > 0) stop.boundVariables = sbv;
        }
        return stop;
      });
    } else if (p.type === "IMAGE") {
      base.scaleMode = p.scaleMode;
      base.imageHash = p.imageHash;
    }
    if (p.boundVariables) {
      var pbv = {};
      var paintBVKeys = ["color", "opacity"];
      for (var pk in p.boundVariables) {
        var pb = p.boundVariables[pk];
        if (pb && pb.id) {
          pbv[pk] = { type: pb.type, id: pb.id };
          try {
            var pv = figma.variables.getVariableById(pb.id);
            if (pv) { pbv[pk].name = pv.name; pbv[pk].resolvedType = pv.resolvedType; }
          } catch (_) {}
        }
      }
      for (var pi = 0; pi < paintBVKeys.length; pi++) {
        var ppk = paintBVKeys[pi];
        if (!(ppk in pbv)) {
          try {
            var ppb = p.boundVariables[ppk];
            if (ppb && ppb.id) {
              pbv[ppk] = { type: ppb.type, id: ppb.id };
              var ppv = figma.variables.getVariableById(ppb.id);
              if (ppv) { pbv[ppk].name = ppv.name; pbv[ppk].resolvedType = ppv.resolvedType; }
            }
          } catch (_) {}
        }
      }
      if (Object.keys(pbv).length > 0) base.boundVariables = pbv;
    }
    return base;
  });
}

function serializeEffects(effects) {
  if (!effects || typeof effects.length !== "number") return [];
  var arr = [];
  for (var i = 0; i < effects.length; i++) { arr.push(effects[i]); }
  return arr.map(function(e) {
    var base = { type: e.type, visible: e.visible !== false, radius: e.radius };
    if (e.offset) base.offset = { x: e.offset.x, y: e.offset.y };
    if (e.spread !== undefined) base.spread = e.spread;
    if (e.color) {
      base.hex = rgbToHex(e.color);
      base.opacity = e.color.a != null ? e.color.a : 1;
    }
    if (e.boundVariables) {
      var ebv = {};
      var ebvKeys = ["radius", "spread", "color", "offsetX", "offsetY"];
      for (var ei = 0; ei < ebvKeys.length; ei++) {
        var ek = ebvKeys[ei];
        try {
          var eb = e.boundVariables[ek];
          if (eb && eb.id) {
            ebv[ek] = { type: eb.type, id: eb.id };
            var ev = figma.variables.getVariableById(eb.id);
            if (ev) { ebv[ek].name = ev.name; ebv[ek].resolvedType = ev.resolvedType; }
          }
        } catch (_) {}
      }
      if (Object.keys(ebv).length > 0) base.boundVariables = ebv;
    }
    return base;
  });
}

function hexToRGB(hex) {
  const v = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(v)) throw new Error("Invalid hex color");
  return { r: parseInt(v.slice(0,2),16)/255, g: parseInt(v.slice(2,4),16)/255, b: parseInt(v.slice(4,6),16)/255 };
}
function getNode(id) {
  const n = figma.getNodeById(id);
  if (!n) throw new Error("Node not found: " + id);
  return n;
}
function assertFills(n) {
  if (!("fills" in n)) throw new Error("Node does not support fills");
}
function base64ToUint8Array(b64) {
  // Pure JS base64 decoder (atob not available in Figma plugin main context)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  // Remove padding and calculate output length
  let padding = 0;
  if (b64.endsWith("==")) padding = 2;
  else if (b64.endsWith("=")) padding = 1;

  const len = b64.length;
  const bufferLength = Math.floor(len * 3 / 4) - padding;
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[b64.charCodeAt(i)];
    const e2 = lookup[b64.charCodeAt(i + 1)];
    const e3 = lookup[b64.charCodeAt(i + 2)];
    const e4 = lookup[b64.charCodeAt(i + 3)];

    if (p < bufferLength) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bufferLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bufferLength) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  // Pure JS base64 encoder (btoa not available in Figma plugin main context)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < len ? chars[b3 & 63] : "=";
  }
  return result;
}

// ---------- Actions dispatcher ----------
async function handleAction(action, input) {
  switch (action) {
    // Create
    case "create_frame": return createFrame(input);
    case "create_rectangle": return createRectangle(input);
    case "create_ellipse": return createEllipse(input);
    case "create_line": return createLine(input);
    case "create_polygon": return createPolygon(input);
    case "create_star": return createStar(input);
    case "add_text": return addText(input);
    case "place_image_base64": return placeImageBase64(input);
    case "create_vector": return createVector(input);
    case "place_image_url": return placeImageUrl(input);

    // Selection / find / pages
    case "find_nodes": return findNodes(input);
    case "select_nodes": return selectNodes(input);
    case "get_selection": return getSelection();
    case "create_page": return createPage(input);
    case "set_current_page": return setCurrentPage(input);

    // Node management
    case "rename_node": return renameNode(input);
    case "delete_node": return deleteNode(input);
    case "duplicate_node": return duplicateNode(input);
    case "resize_node": return resizeNode(input);
    case "rotate_node": return rotateNode(input);
    case "set_position": return setPosition(input);
    case "move_to_parent": return moveToParent(input);
    case "reorder_node": return reorderNode(input);
    case "get_node_info": return getNodeInfo(input);
    case "set_visibility": return setVisibility(input);
    case "set_locked": return setLocked(input);
    case "flatten_node": return flattenNode(input);
    case "group_nodes": return groupNodes(input);
    case "ungroup": return ungroup(input);

    // Styling
    case "set_fill": return setFill(input);
    case "set_stroke": return setStroke(input);
    case "set_corner_radius": return setCornerRadius(input);
    case "set_opacity": return setOpacity(input);
    case "set_blend_mode": return setBlendMode(input);
    case "add_effect": return addEffect(input);
    case "clear_effects": return clearEffects(input);
    case "set_gradient_fill": return setGradientFill(input);
    case "set_gradient_stroke": return setGradientStroke(input);
    case "set_text_gradient": return setTextGradient(input);
    case "layout_grid_add": return layoutGridAdd(input);
    case "layout_grid_clear": return layoutGridClear(input);

    // Auto Layout & Constraints
    case "set_auto_layout": return setAutoLayout(input);
    case "set_constraints": return setConstraints(input);

    // Text
    case "set_text_content": return setTextContent(input);
    case "set_text_style": return setTextStyle(input);
    case "set_text_color": return setTextColor(input);

    // Components / booleans
    case "create_component": return createComponent(input);
    case "create_instance": return createInstance(input);
    case "detach_instance": return detachInstance(input);
    case "boolean_op": return booleanOp(input);

    // Export / data / generic
    case "export_node": return exportNode(input);
    case "set_plugin_data": return setPluginData(input);
    case "get_plugin_data": return getPluginData(input);
    case "set_properties": return setProperties(input);

    // Variables
    case "create_variable_collection": return createVariableCollection(input);
    case "create_variable": return createVariable(input);
    case "get_local_variable_collections": return getLocalVariableCollections(input);
    case "get_local_variables": return getLocalVariables(input);
    case "set_variable_value": return setVariableValue(input);
    case "bind_variable": return bindVariable(input);
    case "unbind_variable": return unbindVariable(input);
    case "delete_variable": return deleteVariable(input);
    case "delete_variable_collection": return deleteVariableCollection(input);
    case "get_library_variable_collections": return await getLibraryVariableCollections();
    case "get_library_variables_in_collection": return await getLibraryVariablesInCollection(input);
    case "import_library_variable": return await importLibraryVariable(input);

    // Styles
    case "create_text_style": return createTextStyle(input);
    case "create_effect_style": return createEffectStyle(input);
    case "get_local_text_styles": return getLocalTextStyles(input);
    case "get_local_effect_styles": return getLocalEffectStyles(input);
    case "apply_text_style": return applyTextStyle(input);
    case "apply_effect_style": return applyEffectStyle(input);
    case "update_text_style": return updateTextStyle(input);
    case "update_effect_style": return updateEffectStyle(input);
    case "delete_style": return deleteStyle(input);

    // Enhanced Components
    case "create_component_from_node": return createComponentFromNode(input);
    case "create_component_set": return createComponentSet(input);
    case "add_component_property": return addComponentProperty(input);
    case "set_instance_property": return setInstanceProperty(input);
    case "get_component_properties": return getComponentProperties(input);

    case "batch_update_components": return await batchUpdateComponents(input);

    default:
      throw new Error("Unknown action: " + action);
  }
}

// ---------- Create ----------
function getParent(parentId) {
  if (!parentId) return page();
  const parent = getNode(parentId);
  if (!("appendChild" in parent)) throw new Error("Parent cannot contain children");
  return parent;
}

function createFrame({ name = "Frame", width = 800, height = 600, x = 0, y = 0, parentId }) {
  const f = figma.createFrame();
  f.name = name; f.resize(width, height); f.x = x; f.y = y;
  getParent(parentId).appendChild(f);
  return { nodeId: f.id, type: f.type, name: f.name, width, height };
}
function createRectangle({ width, height, x = 0, y = 0, cornerRadius, hex, parentId }) {
  const r = figma.createRectangle(); r.resize(width, height);
  if (typeof cornerRadius === "number") r.cornerRadius = cornerRadius;
  if (hex) r.fills = [{ type: "SOLID", color: hexToRGB(hex) }];
  r.x = x; r.y = y; getParent(parentId).appendChild(r);
  return { nodeId: r.id, type: r.type };
}
function createEllipse({ width, height, x = 0, y = 0, hex, parentId }) {
  const e = figma.createEllipse(); e.resize(width, height);
  if (hex) e.fills = [{ type: "SOLID", color: hexToRGB(hex) }];
  e.x = x; e.y = y; getParent(parentId).appendChild(e);
  return { nodeId: e.id, type: e.type };
}
function createLine({ x = 0, y = 0, length, rotation = 0, strokeHex = "#111827", strokeWeight = 1, parentId }) {
  const l = figma.createLine();
  l.x = x; l.y = y; l.rotation = rotation;
  l.strokes = [{ type: "SOLID", color: hexToRGB(strokeHex) }];
  l.strokeWeight = strokeWeight;
  // Figma line length controlled via vector network — easiest: resize in x.
  l.resize(length, 0);
  getParent(parentId).appendChild(l);
  return { nodeId: l.id, type: l.type };
}
function createPolygon({ sides, width, height, x = 0, y = 0, hex, parentId }) {
  const p = figma.createPolygon(); p.pointCount = sides; p.resize(width, height);
  if (hex) p.fills = [{ type: "SOLID", color: hexToRGB(hex) }];
  p.x = x; p.y = y; getParent(parentId).appendChild(p);
  return { nodeId: p.id, type: p.type };
}
function createStar({ points, width, height, x = 0, y = 0, hex, parentId }) {
  const s = figma.createStar(); s.pointCount = points; s.resize(width, height);
  if (hex) s.fills = [{ type: "SOLID", color: hexToRGB(hex) }];
  s.x = x; s.y = y; getParent(parentId).appendChild(s);
  return { nodeId: s.id, type: s.type };
}
async function addText({ text, x = 0, y = 0, fontFamily = "Inter", fontStyle = "Regular", fontSize = 32, parentId }) {
  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  const t = figma.createText();
  t.fontName = { family: fontFamily, style: fontStyle };
  t.characters = text;
  if (fontSize) t.fontSize = fontSize;
  t.x = x; t.y = y; getParent(parentId).appendChild(t);
  return { nodeId: t.id, type: t.type, text: t.characters };
}
function placeImageBase64({ width, height, x = 0, y = 0, base64, parentId }) {
  const bytes = base64ToUint8Array(base64);
  const image = figma.createImage(bytes);
  const r = figma.createRectangle(); r.resize(width, height); r.x = x; r.y = y;
  r.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
  getParent(parentId).appendChild(r);
  return { nodeId: r.id, type: r.type };
}

// Convert SVG path to Figma's vectorPaths API format
// vectorPaths API supports: M, L, C, Q, Z (and H, V converted to L)
// vectorPaths API does NOT support: A (arc), S (smooth curve), T (smooth quadratic)
// This function converts relative to absolute AND converts S→C, T→Q
// Arc (A) commands throw an error - use svgString parameter instead for full SVG support
function normalizePathToAbsolute(pathData) {
  const cmdRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  const numRegex = /-?[\d.]+(?:e[+-]?\d+)?/gi;

  let result = "";
  let curX = 0, curY = 0;
  let startX = 0, startY = 0;
  // Track last control point for S and T commands
  let lastCubicX2 = 0, lastCubicY2 = 0;
  let lastQuadX1 = 0, lastQuadY1 = 0;
  let lastCmd = '';

  let match;
  while ((match = cmdRegex.exec(pathData)) !== null) {
    const cmd = match[1];
    const argsStr = match[2];
    const nums = argsStr.match(numRegex) || [];
    const args = nums.map(Number);

    const isRelative = cmd === cmd.toLowerCase();
    const absCmd = cmd.toUpperCase();

    switch (absCmd) {
      case 'M':
        for (let i = 0; i < args.length; i += 2) {
          const x = isRelative ? curX + args[i] : args[i];
          const y = isRelative ? curY + args[i + 1] : args[i + 1];
          result += (i === 0 ? 'M ' : 'L ') + x + ' ' + y + ' ';
          curX = x; curY = y;
          if (i === 0) { startX = x; startY = y; }
        }
        lastCmd = 'M';
        break;

      case 'L':
        for (let i = 0; i < args.length; i += 2) {
          const x = isRelative ? curX + args[i] : args[i];
          const y = isRelative ? curY + args[i + 1] : args[i + 1];
          result += 'L ' + x + ' ' + y + ' ';
          curX = x; curY = y;
        }
        lastCmd = 'L';
        break;

      case 'H':
        for (let i = 0; i < args.length; i++) {
          const x = isRelative ? curX + args[i] : args[i];
          result += 'L ' + x + ' ' + curY + ' ';
          curX = x;
        }
        lastCmd = 'H';
        break;

      case 'V':
        for (let i = 0; i < args.length; i++) {
          const y = isRelative ? curY + args[i] : args[i];
          result += 'L ' + curX + ' ' + y + ' ';
          curY = y;
        }
        lastCmd = 'V';
        break;

      case 'C':
        for (let i = 0; i < args.length; i += 6) {
          const x1 = isRelative ? curX + args[i] : args[i];
          const y1 = isRelative ? curY + args[i + 1] : args[i + 1];
          const x2 = isRelative ? curX + args[i + 2] : args[i + 2];
          const y2 = isRelative ? curY + args[i + 3] : args[i + 3];
          const x = isRelative ? curX + args[i + 4] : args[i + 4];
          const y = isRelative ? curY + args[i + 5] : args[i + 5];
          result += 'C ' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ' + x + ' ' + y + ' ';
          lastCubicX2 = x2; lastCubicY2 = y2;
          curX = x; curY = y;
        }
        lastCmd = 'C';
        break;

      case 'S': // Smooth curve → Convert to C
        for (let i = 0; i < args.length; i += 4) {
          // First control point is reflection of last cubic's second control point
          let x1, y1;
          if (lastCmd === 'C' || lastCmd === 'S') {
            x1 = 2 * curX - lastCubicX2;
            y1 = 2 * curY - lastCubicY2;
          } else {
            x1 = curX;
            y1 = curY;
          }
          const x2 = isRelative ? curX + args[i] : args[i];
          const y2 = isRelative ? curY + args[i + 1] : args[i + 1];
          const x = isRelative ? curX + args[i + 2] : args[i + 2];
          const y = isRelative ? curY + args[i + 3] : args[i + 3];
          result += 'C ' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ' + x + ' ' + y + ' ';
          lastCubicX2 = x2; lastCubicY2 = y2;
          curX = x; curY = y;
        }
        lastCmd = 'S';
        break;

      case 'Q':
        for (let i = 0; i < args.length; i += 4) {
          const x1 = isRelative ? curX + args[i] : args[i];
          const y1 = isRelative ? curY + args[i + 1] : args[i + 1];
          const x = isRelative ? curX + args[i + 2] : args[i + 2];
          const y = isRelative ? curY + args[i + 3] : args[i + 3];
          result += 'Q ' + x1 + ' ' + y1 + ' ' + x + ' ' + y + ' ';
          lastQuadX1 = x1; lastQuadY1 = y1;
          curX = x; curY = y;
        }
        lastCmd = 'Q';
        break;

      case 'T': // Smooth quadratic → Convert to Q
        for (let i = 0; i < args.length; i += 2) {
          let x1, y1;
          if (lastCmd === 'Q' || lastCmd === 'T') {
            x1 = 2 * curX - lastQuadX1;
            y1 = 2 * curY - lastQuadY1;
          } else {
            x1 = curX;
            y1 = curY;
          }
          const x = isRelative ? curX + args[i] : args[i];
          const y = isRelative ? curY + args[i + 1] : args[i + 1];
          result += 'Q ' + x1 + ' ' + y1 + ' ' + x + ' ' + y + ' ';
          lastQuadX1 = x1; lastQuadY1 = y1;
          curX = x; curY = y;
        }
        lastCmd = 'T';
        break;

      case 'A': // Arc - not supported by Figma's vectorPaths API
        throw new Error("SVG Arc commands (A/a) are not supported in pathData mode. Use 'svgString' parameter instead for full SVG support.");

      case 'Z':
        result += 'Z ';
        curX = startX; curY = startY;
        lastCmd = 'Z';
        break;
    }
  }

  return result.trim();
}

function createVector({ pathData, width, height, x = 0, y = 0, fillHex, strokeHex, strokeWeight = 1, name = "Vector", parentId, svgString }) {
  // If full SVG string provided, use createNodeFromSvg (handles arcs, circles, etc.)
  if (svgString) {
    const frame = figma.createNodeFromSvg(svgString);
    frame.name = name;
    frame.x = x;
    frame.y = y;
    if (width && height) {
      frame.resize(width, height);
    }
    getParent(parentId).appendChild(frame);
    return { nodeId: frame.id, type: frame.type, name: frame.name };
  }

  // Validate pathData is provided
  if (!pathData) {
    throw new Error("Either 'svgString' or 'pathData' must be provided");
  }

  // Otherwise use pathData with vectorPaths API
  const vector = figma.createVector();
  vector.name = name;

  // Convert relative commands to absolute (Figma vectorPaths only supports absolute)
  const normalizedPath = normalizePathToAbsolute(pathData);

  vector.vectorPaths = [{
    windingRule: "NONZERO",
    data: normalizedPath
  }];

  // Resize to desired dimensions
  vector.resize(width, height);
  vector.x = x;
  vector.y = y;

  // Apply fill if specified
  if (fillHex) {
    vector.fills = [{ type: "SOLID", color: hexToRGB(fillHex) }];
  } else {
    vector.fills = [];
  }

  // Apply stroke if specified
  if (strokeHex) {
    vector.strokes = [{ type: "SOLID", color: hexToRGB(strokeHex) }];
    vector.strokeWeight = strokeWeight;
    vector.strokeCap = "ROUND";
    vector.strokeJoin = "ROUND";
  }

  getParent(parentId).appendChild(vector);
  return { nodeId: vector.id, type: vector.type, name: vector.name };
}

function placeImageUrl({ width, height, x = 0, y = 0, base64, cornerRadius = 0, name = "Image", parentId }) {
  // base64 is passed from server after fetching the URL
  const bytes = base64ToUint8Array(base64);
  const image = figma.createImage(bytes);
  const r = figma.createRectangle();
  r.name = name;
  r.resize(width, height);
  r.x = x;
  r.y = y;
  if (cornerRadius > 0) r.cornerRadius = cornerRadius;
  r.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
  getParent(parentId).appendChild(r);
  return { nodeId: r.id, type: r.type, name: r.name };
}

// ---------- Selection / find / pages ----------
function findNodes({ type, nameContains, within }) {
  let scope = within ? getNode(within) : page();
  if (!("findAll" in scope)) throw new Error("Invalid 'within' scope");
  const nodes = scope.findAll(n => {
    const typeOk = type ? n.type === type : true;
    const nameOk = nameContains ? (("name" in n) && String(n.name).toLowerCase().includes(nameContains.toLowerCase())) : true;
    return typeOk && nameOk;
  });
  return nodes.map(n => ({ id: n.id, type: n.type, name: "name" in n ? n.name : undefined }));
}
function selectNodes({ nodeIds }) {
  const nodes = nodeIds.map(getNode).filter(n => !!n);
  figma.currentPage.selection = nodes;
  return { selected: nodes.map(n => n.id) };
}
function getSelection() {
  return figma.currentPage.selection.map(n => ({ id: n.id, type: n.type, name: "name" in n ? n.name : undefined }));
}
function createPage({ name = "Page", makeCurrent = true }) {
  const p = figma.createPage(); p.name = name;
  if (makeCurrent) figma.currentPage = p;
  return { pageId: p.id, name: p.name };
}
function setCurrentPage({ pageId }) {
  const p = getNode(pageId);
  if (p.type !== "PAGE") throw new Error("Not a page");
  figma.currentPage = p;
  return { pageId: p.id };
}

// ---------- Node management ----------
function renameNode({ nodeId, name }) { const n = getNode(nodeId); if ("name" in n) n.name = name; return { nodeId }; }
function deleteNode({ nodeId }) { const n = getNode(nodeId); n.remove(); return { removed: nodeId }; }
function duplicateNode({ nodeId, parentId, x, y }) {
  const n = getNode(nodeId);
  const copy = n.clone();

  // Determine target parent
  const targetParent = parentId ? getNode(parentId) : n.parent;
  if (!targetParent) throw new Error("No valid parent for duplicate");
  if (!("children" in targetParent)) throw new Error("Target parent cannot contain children");

  // Add to target parent
  targetParent.appendChild(copy);

  // Set position if specified
  if (typeof x === "number") copy.x = x;
  if (typeof y === "number") copy.y = y;

  return { nodeId: copy.id, parentId: targetParent.id };
}
function resizeNode({ nodeId, width, height }) { const n = getNode(nodeId); if (!("resize" in n)) throw new Error("Node cannot be resized"); n.resize(width, height); return { nodeId }; }
function rotateNode({ nodeId, rotation }) { const n = getNode(nodeId); if (!("rotation" in n)) throw new Error("No rotation on node"); n.rotation = rotation; return { nodeId }; }
function setPosition({ nodeId, x, y }) { const n = getNode(nodeId); if (!("x" in n && "y" in n)) throw new Error("Node not positionable"); n.x = x; n.y = y; return { nodeId }; }

function moveToParent({ nodeId, parentId, index, x, y }) {
  const node = getNode(nodeId);
  const newParent = getNode(parentId);

  // Check if parent can have children
  if (!("children" in newParent)) {
    throw new Error("Target parent cannot contain children. Must be a frame, group, component, or page.");
  }

  // Store absolute position before moving if we need to preserve it
  const oldAbsoluteX = node.absoluteTransform ? node.absoluteTransform[0][2] : 0;
  const oldAbsoluteY = node.absoluteTransform ? node.absoluteTransform[1][2] : 0;

  // Move node to new parent
  if (typeof index === "number" && index >= 0) {
    newParent.insertChild(Math.min(index, newParent.children.length), node);
  } else {
    newParent.appendChild(node);
  }

  // Set position within new parent if specified
  if (typeof x === "number" && "x" in node) node.x = x;
  if (typeof y === "number" && "y" in node) node.y = y;

  return {
    nodeId: node.id,
    newParentId: newParent.id,
    newParentName: "name" in newParent ? newParent.name : undefined
  };
}

function reorderNode({ nodeId, index }) {
  const node = getNode(nodeId);
  const parent = node.parent;

  if (!parent || !("children" in parent)) {
    throw new Error("Node has no valid parent with children");
  }

  // Get current siblings
  const siblings = parent.children;
  const currentIndex = siblings.indexOf(node);

  if (currentIndex === -1) throw new Error("Node not found in parent");

  // Calculate target index
  let targetIndex;
  if (index < 0) {
    // Negative index: count from end (-1 = last, -2 = second to last)
    targetIndex = Math.max(0, siblings.length + index);
  } else {
    targetIndex = Math.min(index, siblings.length - 1);
  }

  // Move to new position using insertChild
  if (targetIndex !== currentIndex) {
    parent.insertChild(targetIndex, node);
  }

  return {
    nodeId: node.id,
    oldIndex: currentIndex,
    newIndex: parent.children.indexOf(node)
  };
}

function getNodeInfo({ nodeId }) {
  const node = getNode(nodeId);

  const info = {
    id: node.id,
    type: node.type,
    name: "name" in node ? node.name : undefined
  };

  // Position and size
  if ("x" in node) info.x = node.x;
  if ("y" in node) info.y = node.y;
  if ("width" in node) info.width = node.width;
  if ("height" in node) info.height = node.height;
  if ("rotation" in node) info.rotation = node.rotation;

  // Absolute position
  if (node.absoluteTransform) {
    info.absoluteX = node.absoluteTransform[0][2];
    info.absoluteY = node.absoluteTransform[1][2];
  }

  // Parent info
  if (node.parent) {
    info.parentId = node.parent.id;
    info.parentType = node.parent.type;
    if ("name" in node.parent) info.parentName = node.parent.name;
  }

  // Children info (for containers)
  if ("children" in node) {
    info.childCount = node.children.length;
    info.children = node.children.map(c => ({
      id: c.id,
      type: c.type,
      name: "name" in c ? c.name : undefined
    }));
  }

  // Index among siblings
  if (node.parent && "children" in node.parent) {
    info.indexInParent = node.parent.children.indexOf(node);
    info.siblingCount = node.parent.children.length;
  }

  // Visibility and locked state
  if ("visible" in node) info.visible = node.visible;
  if ("locked" in node) info.locked = node.locked;

  // Opacity
  if ("opacity" in node) info.opacity = node.opacity;

  // Blend mode
  if ("blendMode" in node) info.blendMode = node.blendMode;

  // Visual properties (fills, strokes, effects)
  if ("fills" in node) {
    try { info.fills = serializePaints(node.fills); } catch (_) {}
  }
  if ("strokes" in node) {
    try { info.strokes = serializePaints(node.strokes); } catch (_) {}
  }
  if ("strokeWeight" in node) info.strokeWeight = node.strokeWeight;
  if ("strokeAlign" in node) info.strokeAlign = node.strokeAlign;

  // Corner radius
  if ("cornerRadius" in node) {
    if (node.cornerRadius !== figma.mixed) {
      info.cornerRadius = node.cornerRadius;
    } else {
      info.cornerRadius = {
        topLeft: node.topLeftRadius,
        topRight: node.topRightRadius,
        bottomLeft: node.bottomLeftRadius,
        bottomRight: node.bottomRightRadius
      };
    }
  }

  // Effects
  if ("effects" in node) {
    try { info.effects = serializeEffects(node.effects); } catch (_) {}
  }

  // Constraints
  if ("constraints" in node) {
    info.constraints = {
      horizontal: node.constraints.horizontal,
      vertical: node.constraints.vertical
    };
  }

  // Clips content (for frames)
  if ("clipsContent" in node) info.clipsContent = node.clipsContent;

  // Layout positioning within auto-layout parent
  if ("layoutAlign" in node) info.layoutAlign = node.layoutAlign;
  if ("layoutGrow" in node) info.layoutGrow = node.layoutGrow;
  if ("layoutPositioning" in node) info.layoutPositioning = node.layoutPositioning;

  // Style IDs (paint styles, text styles, effect styles)
  if ("fillStyleId" in node && node.fillStyleId && node.fillStyleId !== "") {
    info.fillStyleId = node.fillStyleId;
  }
  if ("strokeStyleId" in node && node.strokeStyleId && node.strokeStyleId !== "") {
    info.strokeStyleId = node.strokeStyleId;
  }
  if ("effectStyleId" in node && node.effectStyleId && node.effectStyleId !== "") {
    info.effectStyleId = node.effectStyleId;
  }
  if ("textStyleId" in node && node.textStyleId && node.textStyleId !== "") {
    info.textStyleId = node.textStyleId;
  }

  // Mask
  if ("isMask" in node) info.isMask = node.isMask;

  // Min/max size
  if ("minWidth" in node && node.minWidth != null) info.minWidth = node.minWidth;
  if ("maxWidth" in node && node.maxWidth != null) info.maxWidth = node.maxWidth;
  if ("minHeight" in node && node.minHeight != null) info.minHeight = node.minHeight;
  if ("maxHeight" in node && node.maxHeight != null) info.maxHeight = node.maxHeight;

  // Auto-layout properties
  if ("layoutMode" in node && node.layoutMode !== "NONE") {
    info.autoLayout = {
      layoutMode: node.layoutMode,
      itemSpacing: node.itemSpacing,
      counterAxisSpacing: node.counterAxisSpacing,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      layoutSizingHorizontal: node.layoutSizingHorizontal,
      layoutSizingVertical: node.layoutSizingVertical,
      layoutWrap: node.layoutWrap
    };
  }

  // Text properties
  if (node.type === "TEXT") {
    info.text = { characters: node.characters };
    try {
      const fs = node.fontSize;
      info.text.fontSize = fs !== figma.mixed ? fs : "MIXED";
    } catch (_) {}
    try {
      const fn = node.fontName;
      info.text.fontName = fn !== figma.mixed ? { family: fn.family, style: fn.style } : "MIXED";
    } catch (_) {}
    if ("textAlignHorizontal" in node) info.text.textAlignHorizontal = node.textAlignHorizontal;
    if ("textAlignVertical" in node) info.text.textAlignVertical = node.textAlignVertical;
    try {
      const lh = node.lineHeight;
      info.text.lineHeight = lh !== figma.mixed ? lh : "MIXED";
    } catch (_) {}
    try {
      const ls = node.letterSpacing;
      info.text.letterSpacing = ls !== figma.mixed ? ls : "MIXED";
    } catch (_) {}
    if ("textAutoResize" in node) info.text.textAutoResize = node.textAutoResize;
    // Text fills (color)
    if ("fills" in node) {
      try { info.text.fills = serializePaints(node.fills); } catch (_) {}
    }
  }

  // Component info
  if (node.type === "INSTANCE" && node.mainComponent) {
    info.mainComponent = { id: node.mainComponent.id, name: node.mainComponent.name };
    try {
      const props = node.componentProperties;
      if (props && Object.keys(props).length > 0) info.componentProperties = props;
    } catch (_) {}
  }
  if (node.type === "COMPONENT") {
    try {
      const propDefs = node.componentPropertyDefinitions;
      if (propDefs && Object.keys(propDefs).length > 0) info.componentPropertyDefinitions = propDefs;
    } catch (_) {}
  }

  // Bound variables (library tokens)
  if ("boundVariables" in node) {
    try {
      var bv = node.boundVariables;
      var bvResult = {};
      var knownBVKeys = [
        "fills", "strokes", "effects",
        "layoutGrids", "componentProperties",
        "fontSize", "fontFamily", "fontStyle", "fontWeight",
        "lineHeight", "letterSpacing", "paragraphSpacing", "paragraphIndent",
        "textCase", "textDecoration",
        "visible", "opacity",
        "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius",
        "itemSpacing", "counterAxisSpacing",
        "paddingLeft", "paddingRight", "paddingTop", "paddingBottom",
        "strokeWeight", "strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight",
        "width", "height",
        "minWidth", "maxWidth", "minHeight", "maxHeight",
        "characters"
      ];

      function extractBinding(binding) {
        if (Array.isArray(binding)) {
          return binding.map(function(b) {
            var entry = { type: b.type, id: b.id };
            try {
              var v = figma.variables.getVariableById(b.id);
              if (v) { entry.name = v.name; entry.resolvedType = v.resolvedType; }
            } catch (_) {}
            return entry;
          });
        } else if (binding && binding.id) {
          var single = { type: binding.type, id: binding.id };
          try {
            var v2 = figma.variables.getVariableById(binding.id);
            if (v2) { single.name = v2.name; single.resolvedType = v2.resolvedType; }
          } catch (_) {}
          return single;
        }
        return null;
      }

      // First try for...in (catches any enumerable keys)
      for (var key in bv) {
        var result = extractBinding(bv[key]);
        if (result != null) bvResult[key] = result;
      }
      // Supplement with explicit key access (Figma proxies may not enumerate all keys)
      for (var ki = 0; ki < knownBVKeys.length; ki++) {
        var bvKey = knownBVKeys[ki];
        if (!(bvKey in bvResult)) {
          try {
            var val = bv[bvKey];
            if (val != null) {
              var r = extractBinding(val);
              if (r != null) bvResult[bvKey] = r;
            }
          } catch (_) {}
        }
      }
      if (Object.keys(bvResult).length > 0) info.boundVariables = bvResult;
    } catch (_) {}
  }

  return info;
}

function setVisibility({ nodeId, visible }) {
  const node = getNode(nodeId);
  if (!("visible" in node)) throw new Error("Node does not support visibility");
  node.visible = visible;
  return { nodeId, visible: node.visible };
}

function setLocked({ nodeId, locked }) {
  const node = getNode(nodeId);
  if (!("locked" in node)) throw new Error("Node does not support locking");
  node.locked = locked;
  return { nodeId, locked: node.locked };
}

function flattenNode({ nodeId }) {
  const node = getNode(nodeId);

  // Check if node can be flattened
  if (!("type" in node)) throw new Error("Invalid node");

  // flatten() works on most scene nodes
  if (typeof figma.flatten !== "function") {
    throw new Error("Flatten not available");
  }

  const flattened = figma.flatten([node]);

  return {
    nodeId: flattened.id,
    type: flattened.type,
    name: "name" in flattened ? flattened.name : undefined
  };
}

function groupNodes({ nodeIds, name = "Group" }) {
  const nodes = nodeIds.map(getNode).filter(n => !!n && "visible" in n);
  if (nodes.length < 2) throw new Error("Need 2+ nodes");
  const parent = nodes[0].parent || page();
  const g = figma.group(nodes, parent); g.name = name; return { nodeId: g.id, type: g.type };
}
function ungroup({ groupId }) {
  const g = getNode(groupId);
  if (g.type !== "GROUP") throw new Error("Not a group");
  const parent = g.parent || page();
  const children = [];
  for (let i = 0; i < g.children.length; i++) children.push(g.children[i]);
  for (const c of children) parent.appendChild(c);
  g.remove();
  return { released: children.map(c => c.id) };
}

// ---------- Styling ----------
function setFill({ nodeId, hex, opacity }) {
  const n = getNode(nodeId); assertFills(n);
  const fill = { type: "SOLID", color: hexToRGB(hex) };
  if (typeof opacity === "number") fill.opacity = Math.max(0, Math.min(1, opacity));
  n.fills = [fill];
  return { nodeId };
}
function setStroke({ nodeId, hex, opacity, strokeWeight, strokeAlign, dashPattern, cap, join }) {
  const n = getNode(nodeId);
  if (!("strokes" in n)) throw new Error("Node does not support strokes");
  const s = { type: "SOLID", color: hexToRGB(hex) };
  if (typeof opacity === "number") s.opacity = Math.max(0, Math.min(1, opacity));
  n.strokes = [s];
  if (strokeWeight != null) n.strokeWeight = strokeWeight;
  if (strokeAlign) n.strokeAlign = strokeAlign;
  if (dashPattern) n.dashPattern = dashPattern;
  if (cap) n.strokeCap = cap;
  if (join) n.strokeJoin = join;
  return { nodeId };
}
function setCornerRadius({ nodeId, radius, topLeft, topRight, bottomRight, bottomLeft }) {
  const n = getNode(nodeId);
  if ("cornerRadius" in n && typeof radius === "number") n.cornerRadius = radius;
  if ("topLeftRadius" in n) {
    if (typeof topLeft === "number") n.topLeftRadius = topLeft;
    if (typeof topRight === "number") n.topRightRadius = topRight;
    if (typeof bottomRight === "number") n.bottomRightRadius = bottomRight;
    if (typeof bottomLeft === "number") n.bottomLeftRadius = bottomLeft;
  }
  return { nodeId };
}
function setOpacity({ nodeId, opacity }) { const n = getNode(nodeId); if (!("opacity" in n)) throw new Error("No opacity on node"); n.opacity = Math.max(0, Math.min(1, opacity)); return { nodeId }; }
function setBlendMode({ nodeId, mode }) { const n = getNode(nodeId); if (!("blendMode" in n)) throw new Error("No blend mode"); n.blendMode = mode; return { nodeId }; }
function addEffect({ nodeId, type, radius = 8, spread = 0, hex = "#000000", opacity = 0.25, offsetX = 0, offsetY = 2 }) {
  const n = getNode(nodeId);
  if (!("effects" in n)) throw new Error("Node does not support effects");
  const newEff = (() => {
    if (type === "LAYER_BLUR" || type === "BACKGROUND_BLUR") {
      return { type, radius, visible: true };
    }
    const rgb = hexToRGB(hex);
    const color = { r: rgb.r, g: rgb.g, b: rgb.b, a: opacity };
    return {
      type,
      radius,
      spread,
      color,
      offset: { x: offsetX, y: offsetY },
      visible: true,
      blendMode: "NORMAL"
    };
  })();
  const currentEffects = [];
  for (let i = 0; i < n.effects.length; i++) currentEffects.push(n.effects[i]);
  currentEffects.push(newEff);
  n.effects = currentEffects;
  return { nodeId, effects: n.effects.length };
}
function clearEffects({ nodeId }) { const n = getNode(nodeId); if (!("effects" in n)) throw new Error("Node does not support effects"); n.effects = []; return { nodeId }; }

// ---------- Gradient tools ----------
function angleToTransform(angle = 135) {
  // Convert angle to Figma's gradient transform matrix
  // Figma uses a 2x3 matrix: [[a, c, tx], [b, d, ty]]
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // Adjust for Figma's coordinate system (0,0 is top-left, gradient goes from 0 to 1)
  return [
    [cos, sin, 0.5 - cos * 0.5 - sin * 0.5],
    [-sin, cos, 0.5 + sin * 0.5 - cos * 0.5]
  ];
}

function hexToRGBA(hex, opacity = 1) {
  const rgb = hexToRGB(hex);
  return { r: rgb.r, g: rgb.g, b: rgb.b, a: opacity };
}

function setGradientFill({ nodeId, startHex, endHex, angle = 135, startOpacity = 1, endOpacity = 1 }) {
  const n = getNode(nodeId);
  assertFills(n);
  const gradientFill = {
    type: "GRADIENT_LINEAR",
    gradientTransform: angleToTransform(angle),
    gradientStops: [
      { position: 0, color: hexToRGBA(startHex, startOpacity) },
      { position: 1, color: hexToRGBA(endHex, endOpacity) }
    ]
  };
  n.fills = [gradientFill];
  return { nodeId };
}

function setGradientStroke({ nodeId, startHex, endHex, strokeWeight = 1, angle = 135, strokeAlign = "CENTER" }) {
  const n = getNode(nodeId);
  if (!("strokes" in n)) throw new Error("Node does not support strokes");
  const gradientStroke = {
    type: "GRADIENT_LINEAR",
    gradientTransform: angleToTransform(angle),
    gradientStops: [
      { position: 0, color: hexToRGBA(startHex, 1) },
      { position: 1, color: hexToRGBA(endHex, 1) }
    ]
  };
  n.strokes = [gradientStroke];
  n.strokeWeight = strokeWeight;
  n.strokeAlign = strokeAlign;
  return { nodeId };
}

function setTextGradient({ nodeId, startHex, endHex, angle = 135 }) {
  const t = getNode(nodeId);
  if (t.type !== "TEXT") throw new Error("Not a text node");
  const gradientFill = {
    type: "GRADIENT_LINEAR",
    gradientTransform: angleToTransform(angle),
    gradientStops: [
      { position: 0, color: hexToRGBA(startHex, 1) },
      { position: 1, color: hexToRGBA(endHex, 1) }
    ]
  };
  t.fills = [gradientFill];
  return { nodeId };
}

function layoutGridAdd({ nodeId, pattern = "COLUMNS", count = 12, gutterSize = 20, sectionSize = 80, hex = "#E5E7EB", opacity = 0.5 }) {
  const n = getNode(nodeId);
  if (!("layoutGrids" in n)) throw new Error("Node does not support layoutGrids");
  const rgb = hexToRGB(hex);
  const g = { pattern, count, gutterSize, sectionSize, color: { r: rgb.r, g: rgb.g, b: rgb.b, a: opacity } };
  const currentGrids = [];
  for (let i = 0; i < n.layoutGrids.length; i++) currentGrids.push(n.layoutGrids[i]);
  currentGrids.push(g);
  n.layoutGrids = currentGrids;
  return { nodeId, grids: n.layoutGrids.length };
}
function layoutGridClear({ nodeId }) { const n = getNode(nodeId); if (!("layoutGrids" in n)) throw new Error("Node does not support layoutGrids"); n.layoutGrids = []; return { nodeId }; }

// ---------- Auto Layout & Constraints ----------
function setAutoLayout(input) {
  const nodeId = input.nodeId;
  const props = Object.assign({}, input);
  delete props.nodeId;
  const f = getNode(nodeId);
  if (f.type !== "FRAME" && f.type !== "COMPONENT" && f.type !== "COMPONENT_SET") {
    throw new Error("Auto Layout only on frames, components, and component sets");
  }
  const map = {
    layoutMode: "layoutMode",
    primaryAxisSizingMode: "primaryAxisSizingMode",
    counterAxisSizingMode: "counterAxisSizingMode",
    itemSpacing: "itemSpacing",
    paddingTop: "paddingTop",
    paddingRight: "paddingRight",
    paddingBottom: "paddingBottom",
    paddingLeft: "paddingLeft",
    primaryAxisAlignItems: "primaryAxisAlignItems",
    counterAxisAlignItems: "counterAxisAlignItems",
    layoutWrap: "layoutWrap",
    counterAxisSpacing: "counterAxisSpacing",
    layoutPositioning: "layoutPositioning"
  };
  for (const k in map) if (k in props) f[map[k]] = props[k];
  return { nodeId: f.id };
}
function setConstraints({ nodeId, horizontal, vertical }) {
  const n = getNode(nodeId);
  if (!("constraints" in n)) throw new Error("No constraints on node");
  n.constraints = {
    horizontal: horizontal || n.constraints.horizontal,
    vertical: vertical || n.constraints.vertical
  };
  return { nodeId };
}

// ---------- Text ----------
async function setTextContent({ nodeId, text }) {
  const t = getNode(nodeId);
  if (t.type !== "TEXT") throw new Error("Not a text node");
  const font = t.fontName;
  if (font && typeof font !== "symbol") await figma.loadFontAsync(font);
  t.characters = text;
  return { nodeId };
}
async function setTextStyle({ nodeId, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, textAlignHorizontal, textAutoResize }) {
  const t = getNode(nodeId);
  if (t.type !== "TEXT") throw new Error("Not a text node");
  const fam = fontFamily || (typeof t.fontName !== "symbol" ? t.fontName.family : "Inter");
  const sty = fontStyle || (typeof t.fontName !== "symbol" ? t.fontName.style : "Regular");
  await figma.loadFontAsync({ family: fam, style: sty });
  t.fontName = { family: fam, style: sty };
  if (fontSize != null) t.fontSize = fontSize;
  if (lineHeight != null) t.lineHeight = { unit: "PIXELS", value: lineHeight };
  if (letterSpacing != null) t.letterSpacing = { unit: "PIXELS", value: letterSpacing };
  if (textAlignHorizontal) t.textAlignHorizontal = textAlignHorizontal;
  if (textAutoResize) t.textAutoResize = textAutoResize;
  return { nodeId };
}
function setTextColor({ nodeId, hex, opacity }) {
  const t = getNode(nodeId);
  if (t.type !== "TEXT") throw new Error("Not a text node");
  const fill = { type: "SOLID", color: hexToRGB(hex) };
  if (typeof opacity === "number") fill.opacity = Math.max(0, Math.min(1, opacity));
  t.fills = [fill];
  return { nodeId };
}

// ---------- Components & Boolean ----------
function createComponent({ name = "Component", fromNodeIds }) {
  const c = figma.createComponent(); c.name = name;
  page().appendChild(c);
  if (Array.isArray(fromNodeIds) && fromNodeIds.length) {
    const nodes = fromNodeIds.map(getNode);
    for (const n of nodes) c.appendChild(n);
  }
  return { nodeId: c.id, type: c.type };
}
function createInstance({ componentId, x = 0, y = 0 }) {
  const c = getNode(componentId);
  if (c.type !== "COMPONENT") throw new Error("Not a component");
  const inst = c.createInstance(); inst.x = x; inst.y = y; page().appendChild(inst);
  return { nodeId: inst.id, type: inst.type };
}
function detachInstance({ nodeId }) {
  const n = getNode(nodeId);
  if ("detachInstance" in n) {
    const d = n.detachInstance();
    return { nodeId: d.id, type: d.type };
  }
  throw new Error("Node is not an instance");
}
function booleanOp({ op, nodeIds, name = "Boolean" }) {
  const nodes = nodeIds.map(getNode);
  const parent = nodes[0].parent || page();
  let res;
  switch (op) {
    case "UNION": res = figma.union(nodes, parent); break;
    case "SUBTRACT": res = figma.subtract(nodes, parent); break;
    case "INTERSECT": res = figma.intersect(nodes, parent); break;
    case "EXCLUDE": res = figma.exclude(nodes, parent); break;
  }
  res.name = name;
  return { nodeId: res.id, type: res.type };
}

// ---------- Export / plugin data / generic ----------
async function exportNode({ nodeId, format = "PNG", scale = 1 }) {
  const n = getNode(nodeId);
  const bytes = await n.exportAsync({ format, constraint: { type: "SCALE", value: scale } });
  const base64 = uint8ArrayToBase64(bytes);
  return { format, base64 };
}
function setPluginData({ nodeId, key, value }) {
  const n = getNode(nodeId);
  n.setPluginData(key, JSON.stringify(value));
  return { nodeId };
}
function getPluginData({ nodeId, key }) {
  const n = getNode(nodeId);
  const raw = n.getPluginData(key);
  try { 
    return { value: JSON.parse(raw) }; 
  } catch (e) { 
    return { value: raw }; 
  }
}
function setProperties({ nodeId, props }) {
  const n = getNode(nodeId);
  // Whitelisted scalar props (expand as needed)
  const allowed = [
    "x","y","rotation","opacity","visible","locked",
    "layoutAlign","layoutGrow",
    "fills","strokes","strokeWeight","strokeAlign","dashPattern","blendMode",
    "itemSpacing","paddingTop","paddingRight","paddingBottom","paddingLeft",
    "primaryAxisAlignItems","counterAxisAlignItems","layoutMode",
    "primaryAxisSizingMode","counterAxisSizingMode","layoutWrap","counterAxisSpacing",
    "textAlignHorizontal","textAlignVertical"
  ];
  for (const k of Object.keys(props || {})) {
    if (allowed.includes(k)) {
      try { n[k] = props[k]; } catch (_) {}
    }
  }
  return { nodeId };
}

// ========== VARIABLES ==========

function createVariableCollection({ name, modes = ["Default"] }) {
  const collection = figma.variables.createVariableCollection(name);

  // Ensure collection is visible (not hidden from publishing)
  collection.hiddenFromPublishing = false;

  // Rename the default mode and add additional modes
  const modeIds = [];
  for (let i = 0; i < modes.length; i++) {
    if (i === 0) {
      // Rename the default mode that's automatically created
      collection.renameMode(collection.modes[0].modeId, modes[i]);
      modeIds.push(collection.modes[0].modeId);
    } else {
      // Add new modes
      const modeId = collection.addMode(modes[i]);
      modeIds.push(modeId);
    }
  }
  return {
    collectionId: collection.id,
    name: collection.name,
    modes: collection.modes.map(m => ({ modeId: m.modeId, name: m.name }))
  };
}

function createVariable({ collectionId, name, resolvedType, values, scopes }) {
  // resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN"
  const collection = figma.variables.getVariableCollectionById(collectionId);
  if (!collection) throw new Error("Variable collection not found: " + collectionId);

  const variable = figma.variables.createVariable(name, collection, resolvedType);

  // Ensure variable is not hidden from publishing (affects visibility)
  variable.hiddenFromPublishing = false;

  // Set scopes to make variable visible in UI picker
  // If not provided, default to ALL_SCOPES for visibility
  if (scopes && scopes.length > 0) {
    variable.scopes = scopes;
  } else {
    // Default scopes based on type
    if (resolvedType === "COLOR") {
      variable.scopes = ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"];
    } else if (resolvedType === "FLOAT") {
      variable.scopes = ["ALL_SCOPES"];
    } else if (resolvedType === "STRING") {
      variable.scopes = ["ALL_SCOPES"];
    }
    // BOOLEAN variables don't support scopes
  }

  // Set values for each mode if provided
  if (values) {
    for (const modeId in values) {
      let value = values[modeId];
      // Convert hex to RGB for COLOR type
      if (resolvedType === "COLOR" && typeof value === "string") {
        value = hexToRGB(value);
      }
      variable.setValueForMode(modeId, value);
    }
  }

  return {
    variableId: variable.id,
    name: variable.name,
    resolvedType: variable.resolvedType,
    collectionId: collection.id,
    scopes: variable.scopes
  };
}

async function getLocalVariableCollections() {
  var collections = await figma.variables.getLocalVariableCollectionsAsync();
  return collections.map(function(c) {
    return {
      collectionId: c.id,
      name: c.name,
      modes: c.modes.map(function(m) { return { modeId: m.modeId, name: m.name }; }),
      variableIds: c.variableIds
    };
  });
}

async function getLocalVariables(input) {
  var collectionId = input != null ? input.collectionId : undefined;
  var variables = await figma.variables.getLocalVariablesAsync();
  var filtered = collectionId
    ? variables.filter(function(v) { return v.variableCollectionId === collectionId; })
    : variables;

  var results = [];
  for (var i = 0; i < filtered.length; i++) {
    var v = filtered[i];
    var valuesByMode = {};
    var collection = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    if (collection) {
      for (var j = 0; j < collection.modes.length; j++) {
        var mode = collection.modes[j];
        var val = v.valuesByMode[mode.modeId];
        if (v.resolvedType === "COLOR" && val && typeof val === "object" && "r" in val) {
          val = rgbToHex(val);
        }
        valuesByMode[mode.modeId] = val;
      }
    }
    results.push({
      variableId: v.id,
      name: v.name,
      resolvedType: v.resolvedType,
      collectionId: v.variableCollectionId,
      valuesByMode: valuesByMode
    });
  }
  return results;
}

function setVariableValue({ variableId, modeId, value }) {
  const variable = figma.variables.getVariableById(variableId);
  if (!variable) throw new Error("Variable not found: " + variableId);

  let processedValue = value;
  if (variable.resolvedType === "COLOR" && typeof value === "string") {
    processedValue = hexToRGB(value);
  }

  variable.setValueForMode(modeId, processedValue);
  return { variableId, modeId, value: processedValue };
}

function bindVariable({ nodeId, field, variableId }) {
  // field examples: "fill", "stroke", "width", "height", "itemSpacing", etc.
  const node = getNode(nodeId);
  const variable = figma.variables.getVariableById(variableId);
  if (!variable) throw new Error("Variable not found: " + variableId);

  // Handle different field types
  if (field === "fill" || field === "fills") {
    // For fill, bind variable to the first solid paint
    if (!("fills" in node)) throw new Error("Node does not support fills");
    const solidPaint = figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
      "color",
      variable
    );
    node.fills = [solidPaint];
  } else if (field === "stroke" || field === "strokes") {
    if (!("strokes" in node)) throw new Error("Node does not support strokes");
    const solidPaint = figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
      "color",
      variable
    );
    node.strokes = [solidPaint];
  } else {
    // For other scalar properties like width, height, itemSpacing, padding, etc.
    node.setBoundVariable(field, variable);
  }

  return { nodeId, field, variableId };
}

function unbindVariable({ nodeId, field }) {
  const node = getNode(nodeId);

  if (field === "fill" || field === "fills") {
    // For fills, we need to replace with an unbound solid paint
    if (!("fills" in node)) throw new Error("Node does not support fills");
    const currentFills = node.fills;
    if (currentFills.length > 0 && currentFills[0].type === "SOLID") {
      // Keep the current color but remove the variable binding
      node.fills = [{ type: "SOLID", color: currentFills[0].color }];
    }
  } else if (field === "stroke" || field === "strokes") {
    // For strokes, same approach
    if (!("strokes" in node)) throw new Error("Node does not support strokes");
    const currentStrokes = node.strokes;
    if (currentStrokes.length > 0 && currentStrokes[0].type === "SOLID") {
      node.strokes = [{ type: "SOLID", color: currentStrokes[0].color }];
    }
  } else {
    // For scalar properties, use setBoundVariable with null
    node.setBoundVariable(field, null);
  }

  return { nodeId, field };
}

function deleteVariable({ variableId }) {
  const variable = figma.variables.getVariableById(variableId);
  if (!variable) throw new Error("Variable not found: " + variableId);
  variable.remove();
  return { deleted: variableId };
}

function deleteVariableCollection({ collectionId }) {
  const collection = figma.variables.getVariableCollectionById(collectionId);
  if (!collection) throw new Error("Variable collection not found: " + collectionId);
  collection.remove();
  return { deleted: collectionId };
}

// Library variables
async function getLibraryVariableCollections() {
  var collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  return collections.map(function(c) {
    return { name: c.name, key: c.key, libraryName: c.libraryName };
  });
}

async function getLibraryVariablesInCollection(input) {
  var collectionKey = input.collectionKey;
  if (!collectionKey) throw new Error("collectionKey is required");
  var variables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collectionKey);
  return variables.map(function(v) {
    return { key: v.key, name: v.name, resolvedType: v.resolvedType };
  });
}

async function importLibraryVariable(input) {
  var key = input.key;
  if (!key) throw new Error("key is required");
  var variable = await figma.variables.importVariableByKeyAsync(key);
  return {
    variableId: variable.id,
    key: variable.key,
    name: variable.name,
    resolvedType: variable.resolvedType,
    remote: variable.remote
  };
}

// Helper to convert RGB to hex
function rgbToHex(rgb) {
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

// ========== STYLES ==========

async function createTextStyle({ name, fontFamily = "Inter", fontStyle = "Regular", fontSize = 16, lineHeight, letterSpacing, textCase, textDecoration }) {
  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });

  const style = figma.createTextStyle();
  style.name = name;
  style.fontName = { family: fontFamily, style: fontStyle };
  style.fontSize = fontSize;

  if (lineHeight != null) {
    style.lineHeight = typeof lineHeight === "number"
      ? { unit: "PIXELS", value: lineHeight }
      : lineHeight;
  }
  if (letterSpacing != null) {
    style.letterSpacing = typeof letterSpacing === "number"
      ? { unit: "PIXELS", value: letterSpacing }
      : letterSpacing;
  }
  if (textCase) style.textCase = textCase;
  if (textDecoration) style.textDecoration = textDecoration;

  return {
    styleId: style.id,
    name: style.name,
    fontFamily: style.fontName.family,
    fontStyle: style.fontName.style,
    fontSize: style.fontSize
  };
}

function createEffectStyle({ name, effects }) {
  const style = figma.createEffectStyle();
  style.name = name;

  // Convert effects array to Figma format
  if (effects && Array.isArray(effects)) {
    style.effects = effects.map(eff => {
      if (eff.type === "DROP_SHADOW" || eff.type === "INNER_SHADOW") {
        const rgb = eff.hex ? hexToRGB(eff.hex) : { r: 0, g: 0, b: 0 };
        return {
          type: eff.type,
          radius: eff.radius || 8,
          spread: eff.spread || 0,
          color: { r: rgb.r, g: rgb.g, b: rgb.b, a: eff.opacity || 0.25 },
          offset: { x: eff.offsetX || 0, y: eff.offsetY || 2 },
          visible: true,
          blendMode: "NORMAL"
        };
      } else if (eff.type === "LAYER_BLUR" || eff.type === "BACKGROUND_BLUR") {
        return {
          type: eff.type,
          radius: eff.radius || 8,
          visible: true
        };
      }
      return eff;
    });
  }

  return {
    styleId: style.id,
    name: style.name,
    effectCount: style.effects.length
  };
}

function getLocalTextStyles() {
  const styles = figma.getLocalTextStyles();
  return styles.map(s => ({
    styleId: s.id,
    name: s.name,
    fontFamily: s.fontName.family,
    fontStyle: s.fontName.style,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing
  }));
}

function getLocalEffectStyles() {
  const styles = figma.getLocalEffectStyles();
  return styles.map(s => ({
    styleId: s.id,
    name: s.name,
    effects: s.effects.map(e => ({
      type: e.type,
      radius: e.radius,
      spread: "spread" in e ? e.spread : undefined,
      offsetX: "offset" in e ? e.offset.x : undefined,
      offsetY: "offset" in e ? e.offset.y : undefined,
      opacity: "color" in e ? e.color.a : undefined,
      hex: "color" in e ? rgbToHex(e.color) : undefined
    }))
  }));
}

async function applyTextStyle({ nodeId, styleId }) {
  const node = getNode(nodeId);
  if (node.type !== "TEXT") throw new Error("Not a text node");

  const style = figma.getStyleById(styleId);
  if (!style || style.type !== "TEXT") throw new Error("Text style not found: " + styleId);

  // Load font before applying
  await figma.loadFontAsync(style.fontName);
  node.textStyleId = styleId;

  return { nodeId, styleId };
}

function applyEffectStyle({ nodeId, styleId }) {
  const node = getNode(nodeId);
  if (!("effectStyleId" in node)) throw new Error("Node does not support effect styles");

  const style = figma.getStyleById(styleId);
  if (!style || style.type !== "EFFECT") throw new Error("Effect style not found: " + styleId);

  node.effectStyleId = styleId;
  return { nodeId, styleId };
}

async function updateTextStyle({ styleId, name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing }) {
  const style = figma.getStyleById(styleId);
  if (!style || style.type !== "TEXT") throw new Error("Text style not found: " + styleId);

  if (name) style.name = name;
  if (fontFamily || fontStyle) {
    const fam = fontFamily || style.fontName.family;
    const sty = fontStyle || style.fontName.style;
    await figma.loadFontAsync({ family: fam, style: sty });
    style.fontName = { family: fam, style: sty };
  }
  if (fontSize != null) style.fontSize = fontSize;
  if (lineHeight != null) {
    style.lineHeight = typeof lineHeight === "number"
      ? { unit: "PIXELS", value: lineHeight }
      : lineHeight;
  }
  if (letterSpacing != null) {
    style.letterSpacing = typeof letterSpacing === "number"
      ? { unit: "PIXELS", value: letterSpacing }
      : letterSpacing;
  }

  return { styleId, name: style.name };
}

function updateEffectStyle({ styleId, name, effects }) {
  const style = figma.getStyleById(styleId);
  if (!style || style.type !== "EFFECT") throw new Error("Effect style not found: " + styleId);

  if (name) style.name = name;
  if (effects && Array.isArray(effects)) {
    style.effects = effects.map(eff => {
      if (eff.type === "DROP_SHADOW" || eff.type === "INNER_SHADOW") {
        const rgb = eff.hex ? hexToRGB(eff.hex) : { r: 0, g: 0, b: 0 };
        return {
          type: eff.type,
          radius: eff.radius || 8,
          spread: eff.spread || 0,
          color: { r: rgb.r, g: rgb.g, b: rgb.b, a: eff.opacity || 0.25 },
          offset: { x: eff.offsetX || 0, y: eff.offsetY || 2 },
          visible: true,
          blendMode: "NORMAL"
        };
      } else if (eff.type === "LAYER_BLUR" || eff.type === "BACKGROUND_BLUR") {
        return {
          type: eff.type,
          radius: eff.radius || 8,
          visible: true
        };
      }
      return eff;
    });
  }

  return { styleId, name: style.name, effectCount: style.effects.length };
}

function deleteStyle({ styleId }) {
  const style = figma.getStyleById(styleId);
  if (!style) throw new Error("Style not found: " + styleId);
  style.remove();
  return { deleted: styleId };
}

// ========== ENHANCED COMPONENTS ==========

function createComponentFromNode({ nodeId, name }) {
  const node = getNode(nodeId);
  if (!("type" in node)) throw new Error("Invalid node");

  // Create component and move node's children/properties into it
  const component = figma.createComponentFromNode(node);
  if (name) component.name = name;

  return {
    componentId: component.id,
    name: component.name,
    type: component.type
  };
}

function createComponentSet({ componentIds, name = "Component Set" }) {
  // Get all components
  const components = componentIds.map(id => {
    const node = getNode(id);
    if (node.type !== "COMPONENT") throw new Error("Node is not a component: " + id);
    return node;
  });

  if (components.length < 1) throw new Error("Need at least 1 component");

  // Combine into component set
  const componentSet = figma.combineAsVariants(components, page());
  componentSet.name = name;

  return {
    componentSetId: componentSet.id,
    name: componentSet.name,
    type: componentSet.type,
    variantCount: componentSet.children.length
  };
}

function addComponentProperty({ componentId, propertyName, propertyType, defaultValue, preferredValues }) {
  const component = getNode(componentId);
  if (component.type !== "COMPONENT" && component.type !== "COMPONENT_SET") {
    throw new Error("Node is not a component or component set");
  }

  // propertyType: "BOOLEAN" | "TEXT" | "INSTANCE_SWAP" | "VARIANT"
  const propDef = {
    type: propertyType,
    defaultValue: defaultValue
  };

  if (preferredValues) {
    propDef.preferredValues = preferredValues;
  }

  component.addComponentProperty(propertyName, propDef.type, propDef.defaultValue);

  return {
    componentId,
    propertyName,
    propertyType
  };
}

function setInstanceProperty({ instanceId, propertyName, value }) {
  const instance = getNode(instanceId);
  if (instance.type !== "INSTANCE") throw new Error("Node is not an instance");

  // Get component properties
  const props = instance.componentProperties;
  if (!props || !(propertyName in props)) {
    throw new Error("Property not found: " + propertyName);
  }

  instance.setProperties({ [propertyName]: value });

  return { instanceId, propertyName, value };
}

function getComponentProperties({ componentId }) {
  const component = getNode(componentId);
  if (component.type !== "COMPONENT" && component.type !== "COMPONENT_SET" && component.type !== "INSTANCE") {
    throw new Error("Node is not a component, component set, or instance");
  }

  const definitions = component.componentPropertyDefinitions || {};
  const values = component.componentProperties || {};

  return {
    componentId,
    definitions: Object.entries(definitions).map(([name, def]) => ({
      name,
      type: def.type,
      defaultValue: def.defaultValue,
      variantOptions: def.variantOptions
    })),
    values: Object.entries(values).map(([name, val]) => ({
      name,
      value: val.value,
      type: val.type
    }))
  };
}

// ---------- Batch Update Components ----------

// Helper: set a property as either a raw value or a variable binding.
// If value is an object with { variableId }, bind that variable.
// If value is a number/string, set it directly (leaves existing binding intact
// only if Figma allows — note: setting a raw value on a variable-bound
// property will implicitly unbind the variable per Figma API behavior).
function applyValue(node, field, value) {
  if (value != null && typeof value === "object" && value.variableId) {
    var v = figma.variables.getVariableById(value.variableId);
    if (!v) throw new Error("Variable not found: " + value.variableId);
    node.setBoundVariable(field, v);
  } else if (value != null) {
    node[field] = value;
  }
}

// Helper: apply a paint (fill/stroke) — raw hex or variable binding
function applyPaint(node, prop, value) {
  if (value != null && typeof value === "object" && value.variableId) {
    var v = figma.variables.getVariableById(value.variableId);
    if (!v) throw new Error("Variable not found: " + value.variableId);
    var paint = figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", v
    );
    node[prop] = [paint];
  } else if (typeof value === "string") {
    // hex string
    var hex = value.replace("#", "");
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    node[prop] = [{ type: "SOLID", color: { r: r, g: g, b: b } }];
  }
}

async function batchUpdateComponents(input) {
  var componentSetId = input.componentSetId;
  var rules = input.rules; // Array of rule objects
  var dryRun = input.dryRun === true;

  var setNode = getNode(componentSetId);
  if (setNode.type !== "COMPONENT_SET") {
    throw new Error("Node " + componentSetId + " is not a COMPONENT_SET");
  }

  var children = setNode.children;
  var updated = 0;
  var skipped = 0;
  var errors = [];
  var details = [];

  for (var i = 0; i < children.length; i++) {
    var comp = children[i];
    if (comp.type !== "COMPONENT") continue;

    // Parse variant properties from name: "Size=md, Hierarchy=Primary, ..."
    var variantProps = {};
    var nameParts = comp.name.split(",");
    for (var p = 0; p < nameParts.length; p++) {
      var kv = nameParts[p].trim().split("=");
      if (kv.length === 2) {
        variantProps[kv[0].trim()] = kv[1].trim();
      }
    }

    // Find all matching rules (applied in order, later rules override)
    var matchedRules = [];
    for (var r = 0; r < rules.length; r++) {
      var rule = rules[r];
      var match = rule.match;
      var matches = true;
      if (match) {
        for (var mk in match) {
          if (variantProps[mk] !== match[mk]) {
            matches = false;
            break;
          }
        }
      }
      // match === null/undefined/empty means "match all"
      if (matches) matchedRules.push(rule);
    }

    if (matchedRules.length === 0) {
      skipped++;
      continue;
    }

    // Merge matched rules (later overrides earlier)
    var merged = {};
    for (var mi = 0; mi < matchedRules.length; mi++) {
      var mr = matchedRules[mi];
      if (mr.cornerRadius != null) merged.cornerRadius = mr.cornerRadius;
      if (mr.padding) {
        if (!merged.padding) merged.padding = {};
        if (mr.padding.left != null) merged.padding.left = mr.padding.left;
        if (mr.padding.right != null) merged.padding.right = mr.padding.right;
        if (mr.padding.top != null) merged.padding.top = mr.padding.top;
        if (mr.padding.bottom != null) merged.padding.bottom = mr.padding.bottom;
      }
      if (mr.itemSpacing != null) merged.itemSpacing = mr.itemSpacing;
      if (mr.sizing) {
        if (!merged.sizing) merged.sizing = {};
        if (mr.sizing.horizontal) merged.sizing.horizontal = mr.sizing.horizontal;
        if (mr.sizing.vertical) merged.sizing.vertical = mr.sizing.vertical;
        if (mr.sizing.width != null) merged.sizing.width = mr.sizing.width;
        if (mr.sizing.height != null) merged.sizing.height = mr.sizing.height;
      }
      if (mr.font) {
        if (!merged.font) merged.font = {};
        if (mr.font.family) merged.font.family = mr.font.family;
        if (mr.font.style) merged.font.style = mr.font.style;
        if (mr.font.size != null) merged.font.size = mr.font.size;
        if (mr.font.lineHeight != null) merged.font.lineHeight = mr.font.lineHeight;
      }
      if (mr.fill != null) merged.fill = mr.fill;
      if (mr.stroke != null) merged.stroke = mr.stroke;
      if (mr.strokeWeight != null) merged.strokeWeight = mr.strokeWeight;
      if (mr.alignment) {
        if (!merged.alignment) merged.alignment = {};
        if (mr.alignment.primary) merged.alignment.primary = mr.alignment.primary;
        if (mr.alignment.counter) merged.alignment.counter = mr.alignment.counter;
      }
    }

    if (dryRun) {
      details.push({ id: comp.id, name: comp.name, matched: matchedRules.length, merged: merged });
      updated++;
      continue;
    }

    try {
      // Corner radius
      if (merged.cornerRadius != null) {
        if (typeof merged.cornerRadius === "object" && merged.cornerRadius.variableId) {
          var crVar = figma.variables.getVariableById(merged.cornerRadius.variableId);
          if (crVar) {
            comp.setBoundVariable("topLeftRadius", crVar);
            comp.setBoundVariable("topRightRadius", crVar);
            comp.setBoundVariable("bottomLeftRadius", crVar);
            comp.setBoundVariable("bottomRightRadius", crVar);
          }
        } else {
          comp.cornerRadius = merged.cornerRadius;
        }
      }

      // Padding
      if (merged.padding) {
        if (merged.padding.left != null) applyValue(comp, "paddingLeft", merged.padding.left);
        if (merged.padding.right != null) applyValue(comp, "paddingRight", merged.padding.right);
        if (merged.padding.top != null) applyValue(comp, "paddingTop", merged.padding.top);
        if (merged.padding.bottom != null) applyValue(comp, "paddingBottom", merged.padding.bottom);
      }

      // Item spacing
      if (merged.itemSpacing != null) applyValue(comp, "itemSpacing", merged.itemSpacing);

      // Fill & stroke
      if (merged.fill != null && "fills" in comp) applyPaint(comp, "fills", merged.fill);
      if (merged.stroke != null && "strokes" in comp) applyPaint(comp, "strokes", merged.stroke);
      if (merged.strokeWeight != null && "strokeWeight" in comp) comp.strokeWeight = merged.strokeWeight;

      // Alignment
      if (merged.alignment) {
        if (merged.alignment.primary) comp.primaryAxisAlignItems = merged.alignment.primary;
        if (merged.alignment.counter) comp.counterAxisAlignItems = merged.alignment.counter;
      }

      // Sizing mode & resize
      if (merged.sizing) {
        if (merged.sizing.horizontal) comp.layoutSizingHorizontal = merged.sizing.horizontal;
        if (merged.sizing.vertical) comp.layoutSizingVertical = merged.sizing.vertical;
        if (merged.sizing.width != null || merged.sizing.height != null) {
          var w = merged.sizing.width != null ? merged.sizing.width : comp.width;
          var h = merged.sizing.height != null ? merged.sizing.height : comp.height;
          comp.resize(w, h);
        }
      }

      // Font (applies to all TEXT descendants)
      if (merged.font) {
        var family = merged.font.family;
        var style = merged.font.style;
        if (family && style) {
          await figma.loadFontAsync({ family: family, style: style });
        }
        var textNodes = comp.findAll(function(n) { return n.type === "TEXT"; });
        for (var ti = 0; ti < textNodes.length; ti++) {
          var tn = textNodes[ti];
          try {
            if (family && style) {
              await figma.loadFontAsync({ family: family, style: style });
              tn.fontName = { family: family, style: style };
            }
            if (merged.font.size != null) tn.fontSize = merged.font.size;
            if (merged.font.lineHeight != null) {
              tn.lineHeight = { value: merged.font.lineHeight, unit: "PIXELS" };
            }
          } catch (fontErr) {
            errors.push("Font error on " + tn.id + ": " + fontErr.message);
          }
        }
      }

      details.push({ id: comp.id, name: comp.name, action: "updated" });
      updated++;
    } catch (err) {
      errors.push(comp.id + " (" + comp.name + "): " + (err.message || String(err)));
    }
  }

  return {
    componentSetId: componentSetId,
    componentSetName: setNode.name,
    totalChildren: children.length,
    updated: updated,
    skipped: skipped,
    errorCount: errors.length,
    errors: errors.length <= 10 ? errors : errors.slice(0, 10).concat(["... and " + (errors.length - 10) + " more"]),
    details: details.length <= 30 ? details : details.slice(0, 30).concat([{ note: "... and " + (details.length - 30) + " more" }])
  };
}
