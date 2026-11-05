import { View, Text, Pressable} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./styled";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

const LandingPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fundstück</Text>
      <Text style={styles.subtitle}>Post lost or found items</Text>

      <Pressable style={styles.button} onPress={() => navigation.navigate("MainTabs")}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
};

export default LandingPage;
