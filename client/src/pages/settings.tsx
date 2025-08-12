import React from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";

export default function Settings() {
  return (
    <Box p={6} minH="100vh">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="white">Settings</Heading>
        <Text color="gray.300">Settings page coming soon...</Text>
      </VStack>
    </Box>
  );
}