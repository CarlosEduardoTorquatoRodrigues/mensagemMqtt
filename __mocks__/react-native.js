const React = require('react');

const View = ({ children, ...props }) => React.createElement('View', props, children);
const Text = ({ children, ...props }) => React.createElement('Text', props, children);
const TouchableOpacity = ({ children, onPress, ...props }) =>
  React.createElement('TouchableOpacity', { ...props, onClick: onPress }, children);
const Pressable = ({ children, onPress, ...props }) =>
  React.createElement('Pressable', { ...props, onClick: onPress }, children);
const TextInput = ({ children, ...props }) =>
  React.createElement('TextInput', props, children);
const ScrollView = ({ children, ...props }) => React.createElement('ScrollView', props, children);
const KeyboardAvoidingView = ({ children, ...props }) =>
  React.createElement('KeyboardAvoidingView', props, children);
const Modal = ({ children, ...props }) => React.createElement('Modal', props, children);
const FlatList = ({ data, renderItem, keyExtractor, ListEmptyComponent, ...props }) => {
  if (!data || data.length === 0) {
    return ListEmptyComponent ? React.createElement(ListEmptyComponent, null) : null;
  }
  return React.createElement(
    'FlatList',
    props,
    data.map((item, index) => {
      const element = renderItem({ item, index });
      const key = keyExtractor ? keyExtractor(item) : String(index);
      return React.isValidElement(element)
        ? React.cloneElement(element, { key })
        : React.createElement('ReactFragment', { key }, element);
    })
  );
};
const Switch = ({ value, onValueChange, ...props }) =>
  React.createElement('Switch', { ...props, value, onChange: () => onValueChange(!value) });

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
};

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios,
};
const useColorScheme = () => 'light';

const Alert = {
  alert: (_title, _message, buttons) => {
    const confirm = buttons?.find((button) => button.style === 'destructive') || buttons?.[0];
    confirm?.onPress?.();
  },
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Switch,
  StyleSheet,
  Platform,
  useColorScheme,
  Alert,
  StatusBar: ({ children, ...props }) => React.createElement('StatusBar', props, children),
  __esModule: true,
};
