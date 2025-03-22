import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { Provider as PaperProvider, Button, Text, Card } from 'react-native-paper';
import axios from 'axios';
import CameraRoll from '@react-native-community/cameraroll';
import { INSTAGRAM_API_URL } from './src/config';

const App = () => {
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const requestCameraRollPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Camera Roll Permission",
            message: "InstaManager needs access to your camera roll to save Instagram media.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const addLink = () => {
    if (newLink.trim() === '') return;
    if (links.length >= 20) {
      Alert.alert('Maximum Links Reached', 'You can only add up to 20 links.');
      return;
    }
    if (!newLink.includes('instagram.com')) {
      Alert.alert('Invalid Link', 'Please enter a valid Instagram link.');
      return;
    }
    setLinks([...links, newLink.trim()]);
    setNewLink('');
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const extractMediaId = (url: string) => {
    const regex = /\/p\/([^/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const downloadMedia = async () => {
    if (links.length === 0) {
      Alert.alert('No Links', 'Please add some Instagram links first.');
      return;
    }

    const hasPermission = await requestCameraRollPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera roll permission is required to save media.');
      return;
    }

    setIsDownloading(true);
    try {
      for (const link of links) {
        const mediaId = extractMediaId(link);
        if (!mediaId) {
          Alert.alert('Invalid Link', `Could not extract media ID from: ${link}`);
          continue;
        }

        // First, get the page content
        const response = await axios.get(`${INSTAGRAM_API_URL}/p/${mediaId}/?__a=1`);
        const mediaData = response.data;

        if (mediaData && mediaData.graphql && mediaData.graphql.shortcode_media) {
          const media = mediaData.graphql.shortcode_media;
          const mediaUrl = media.is_video ? media.video_url : media.display_url;

          // Download the media
          const mediaResponse = await axios.get(mediaUrl, { responseType: 'blob' });
          const blob = mediaResponse.data;

          // Save to camera roll
          await CameraRoll.save(mediaUrl);
        } else {
          Alert.alert('Error', `Could not fetch media for: ${link}`);
        }
      }
      Alert.alert('Success', 'All media has been downloaded to your camera roll!');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download media. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>InstaManager</Text>
          <Text style={styles.subtitle}>Download up to 20 Instagram posts</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Paste Instagram link here"
            value={newLink}
            onChangeText={setNewLink}
            onSubmitEditing={addLink}
          />
          <Button mode="contained" onPress={addLink} style={styles.addButton}>
            Add Link
          </Button>
        </View>

        <ScrollView style={styles.linksContainer}>
          {links.map((link, index) => (
            <Card key={index} style={styles.linkCard}>
              <Card.Content style={styles.cardContent}>
                <Text numberOfLines={1} style={styles.linkText}>
                  {link}
                </Text>
                <Button
                  mode="text"
                  onPress={() => removeLink(index)}
                  style={styles.removeButton}
                >
                  Remove
                </Button>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        <Button
          mode="contained"
          onPress={downloadMedia}
          loading={isDownloading}
          disabled={isDownloading || links.length === 0}
          style={styles.downloadButton}
        >
          {isDownloading ? 'Downloading...' : 'Download All'}
        </Button>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  addButton: {
    justifyContent: 'center',
  },
  linksContainer: {
    flex: 1,
    padding: 15,
  },
  linkCard: {
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    marginLeft: 10,
  },
  downloadButton: {
    margin: 15,
    paddingVertical: 8,
  },
});

export default App; 