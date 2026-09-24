import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditorHeaderActions from '../components/EditorHeaderActions';
import FeedScreen from '../screens/FeedScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import type { RootStackParamList, ScreenProps } from './navigation';

const editorOptions = ({ route }: ScreenProps<'NoteEditor'>) => ({
  presentation: 'modal' as const,
  title: '',
  headerRight: () => <EditorHeaderActions id={route.params.id} />,
});

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={editorOptions}
      />
    </Stack.Navigator>
  );
}
