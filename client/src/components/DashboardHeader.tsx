import { useQuery } from "@tanstack/react-query";
import { Box, Flex, Text, Avatar, Badge, Spinner } from "@chakra-ui/react";
import { User } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AssetLocationSearch } from "./AssetLocationSearch";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  brandConfig?: {
    appName?: string;
    primaryColor?: string;
  };
}

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/validate"],
    retry: false,
    refetchOnWindowFocus: false,
  });


  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserDisplayName = () => {
    if (!user) return "Unknown User";
    return user.email || user.username || "Admin User";
  };

  const getBrandColor = () => {
    return user?.brandConfig?.primaryColor || "#4A90E2";
  };

  if (isLoading) {
    return (
      <Box
        bg="gray.800"
        borderBottomWidth="1px"
        borderBottomColor="gray.700"
        px={6}
        py={4}
      >
        <Flex justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold" color="white">
            OpsSync.ai Dashboard
          </Text>
          <Flex align="center" gap={4}>
            <Spinner size="sm" color="blue.400" />
          </Flex>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      bg="gray.800"
      borderBottomWidth="1px"
      borderBottomColor="gray.700"
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="white">
            {user?.brandConfig?.appName || "OpsSync.ai"} Dashboard
          </Text>
          <Text fontSize="sm" color="gray.400">
            {formatDate(currentTime)}
          </Text>
        </Box>

        <AssetLocationSearch />

        <Flex align="center" gap={6}>
          <NotificationBell />

          <Flex align="center" gap={3}>
            <Avatar
              size="sm"
              name={getUserDisplayName()}
              bg={getBrandColor()}
              color="white"
              icon={<User size={16} />}
            />
            <Box textAlign="right">
              <Text fontSize="sm" fontWeight="medium" color="white">
                {getUserDisplayName()}
              </Text>
              <Badge
                size="sm"
                colorScheme="green"
                variant="solid"
                fontSize="xs"
              >
                Online
              </Badge>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}