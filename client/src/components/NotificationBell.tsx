import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Badge,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Flex,
  Divider,
} from "@chakra-ui/react";
import { Bell, Check, X, AlertCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

export function NotificationBell() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications for current user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Count unread notifications
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/notifications/mark-all-read", {
        method: "PATCH",
        body: JSON.stringify({ userId: "current-user" }), // TODO: Get from auth
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      default:
        return "blue";
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<Bell className="w-5 h-5" />}
            variant="ghost"
            colorScheme="gray"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="notification-bell"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-8px"
              right="-8px"
              colorScheme="red"
              variant="solid"
              borderRadius="full"
              fontSize="xs"
              minH="18px"
              minW="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              data-testid="notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent w="400px" bg="gray.800" borderColor="gray.600">
        <PopoverCloseButton color="white" />
        <PopoverHeader
          borderBottomColor="gray.600"
          color="white"
          fontWeight="bold"
        >
          <Flex justify="space-between" align="center">
            <Text>Notifications</Text>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={handleMarkAllAsRead}
                isLoading={markAllAsReadMutation.isPending}
                data-testid="mark-all-read"
              >
                Mark all read
              </Button>
            )}
          </Flex>
        </PopoverHeader>

        <PopoverBody p={0} maxH="400px" overflowY="auto">
          {isLoading ? (
            <Flex justify="center" align="center" h="100px">
              <Spinner size="sm" color="blue.400" />
            </Flex>
          ) : notifications.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="100px"
              color="gray.400"
            >
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <Text fontSize="sm">No notifications</Text>
            </Flex>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification: Notification, index: number) => (
                <Box key={notification.id}>
                  <Box
                    p={4}
                    bg={notification.isRead ? "transparent" : "blue.900"}
                    _hover={{ bg: "gray.700" }}
                    cursor="pointer"
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    data-testid={`notification-${index}`}
                  >
                    <Flex justify="space-between" align="start" mb={2}>
                      <HStack spacing={2} flex={1}>
                        {getPriorityIcon(notification.priority || "normal")}
                        <Text
                          fontSize="sm"
                          fontWeight={notification.isRead ? "normal" : "semibold"}
                          color="white"
                          noOfLines={2}
                        >
                          {notification.title}
                        </Text>
                      </HStack>
                      <HStack spacing={1}>
                        {!notification.isRead && (
                          <IconButton
                            aria-label="Mark as read"
                            icon={<Check className="w-3 h-3" />}
                            size="xs"
                            variant="ghost"
                            colorScheme="green"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            data-testid={`mark-read-${index}`}
                          />
                        )}
                        <IconButton
                          aria-label="Delete notification"
                          icon={<X className="w-3 h-3" />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          data-testid={`delete-notification-${index}`}
                        />
                      </HStack>
                    </Flex>

                    <Text fontSize="xs" color="gray.400" mb={2} noOfLines={2}>
                      {notification.message}
                    </Text>

                    <Flex justify="space-between" align="center">
                      <Badge
                        size="sm"
                        colorScheme={getPriorityBadgeColor(notification.priority || "normal")}
                        variant="subtle"
                      >
                        {notification.type}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </Flex>
                  </Box>
                  {index < notifications.length - 1 && <Divider borderColor="gray.600" />}
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}