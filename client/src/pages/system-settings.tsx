import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Badge,
  IconButton,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { Save, Settings, DollarSign, Mail, Users, Bell, AlertTriangle } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function SystemSettings() {
  const [approvalThreshold, setApprovalThreshold] = useState<number>(1000);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newRecipientRole, setNewRecipientRole] = useState("");
  
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch current approval threshold
  const { data: thresholdSetting, isLoading: thresholdLoading } = useQuery({
    queryKey: ["/api/system-settings", "approval_threshold"],
    onSuccess: (data) => {
      if (data?.value) {
        try {
          setApprovalThreshold(parseFloat(JSON.parse(data.value)));
        } catch {
          setApprovalThreshold(parseFloat(data.value));
        }
      }
    }
  });

  // Fetch notification recipients
  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ["/api/notification-recipients"],
  });

  // Update approval threshold mutation
  const updateThresholdMutation = useMutation({
    mutationFn: async (threshold: number) => {
      await apiRequest("/api/system-settings", {
        method: "POST",
        body: JSON.stringify({
          key: "approval_threshold",
          value: JSON.stringify(threshold),
          description: "Dollar amount threshold for work order approvals"
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: "Settings Updated",
        description: "Approval threshold has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update approval threshold.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Failed to update threshold:", error);
    },
  });

  // Add notification recipient mutation
  const addRecipientMutation = useMutation({
    mutationFn: async (recipientData: { name: string; email: string; role: string }) => {
      await apiRequest("/api/notification-recipients", {
        method: "POST",
        body: JSON.stringify({
          ...recipientData,
          isActive: true,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-recipients"] });
      setNewRecipientName("");
      setNewRecipientEmail("");
      setNewRecipientRole("");
      toast({
        title: "Recipient Added",
        description: "Notification recipient has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add notification recipient.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Failed to add recipient:", error);
    },
  });

  // Toggle recipient active status mutation
  const toggleRecipientMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest(`/api/notification-recipients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-recipients"] });
    },
  });

  const handleSaveThreshold = () => {
    updateThresholdMutation.mutate(approvalThreshold);
  };

  const handleAddRecipient = () => {
    if (!newRecipientName || !newRecipientEmail || !newRecipientRole) {
      toast({
        title: "Validation Error",
        description: "Please fill in all recipient fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    addRecipientMutation.mutate({
      name: newRecipientName,
      email: newRecipientEmail,
      role: newRecipientRole,
    });
  };

  const handleToggleRecipient = (id: string, currentStatus: boolean) => {
    toggleRecipientMutation.mutate({ id, isActive: !currentStatus });
  };

  return (
    <Box p={6} bg="gray.900" minH="100vh">
      <VStack spacing={8} align="stretch" maxW="4xl" mx="auto">
        {/* Header */}
        <Box>
          <HStack spacing={3} mb={2}>
            <Settings className="h-8 w-8 text-blue-400" />
            <Heading as="h1" size="xl" color="white">
              System Settings
            </Heading>
          </HStack>
          <Text color="gray.400" fontSize="lg">
            Configure approval workflows and notification settings for work orders
          </Text>
        </Box>

        {/* Approval Threshold Section */}
        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <HStack spacing={2}>
              <DollarSign className="h-5 w-5 text-green-400" />
              <Heading as="h2" size="md" color="white">
                Work Order Approval Threshold
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="blue.900" borderColor="blue.500">
                <AlertIcon color="blue.400" />
                <Box>
                  <AlertTitle color="blue.200">Approval Workflow</AlertTitle>
                  <AlertDescription color="blue.300">
                    Work orders exceeding this dollar amount will require management approval before work begins. 
                    Notifications will be sent to designated approvers automatically.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl>
                <FormLabel color="gray.200">Approval Threshold ($USD)</FormLabel>
                <NumberInput
                  value={approvalThreshold}
                  onChange={(_, value) => setApprovalThreshold(value || 0)}
                  min={0}
                  max={999999}
                  step={50}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                  data-testid="input-approval-threshold"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="gray.300" />
                    <NumberDecrementStepper color="gray.300" />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText color="gray.400">
                  Current threshold: ${thresholdSetting?.value ? parseFloat(JSON.parse(thresholdSetting.value)).toFixed(2) : '1000.00'}
                </FormHelperText>
              </FormControl>

              <Button
                leftIcon={<Save className="h-4 w-4" />}
                colorScheme="blue"
                onClick={handleSaveThreshold}
                isLoading={updateThresholdMutation.isPending}
                data-testid="button-save-threshold"
              >
                Save Threshold
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Notification Recipients Section */}
        <Card bg="gray.800" borderColor="gray.700">
          <CardHeader>
            <HStack spacing={2}>
              <Bell className="h-5 w-5 text-blue-400" />
              <Heading as="h2" size="md" color="white">
                Notification Recipients
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Alert status="warning" bg="orange.900" borderColor="orange.500">
                <AlertIcon color="orange.400" />
                <Box>
                  <AlertTitle color="orange.200">Email Notifications</AlertTitle>
                  <AlertDescription color="orange.300">
                    Up to 10 recipients can receive email notifications for work order approvals. 
                    Configure SENDGRID_API_KEY in environment variables to enable email sending.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Add New Recipient */}
              <Box p={4} bg="gray.700" rounded="lg" borderWidth={1} borderColor="gray.600">
                <Heading as="h3" size="sm" color="white" mb={4}>
                  Add New Recipient
                </Heading>
                <VStack spacing={3}>
                  <HStack spacing={3} w="100%">
                    <FormControl>
                      <FormLabel color="gray.200" fontSize="sm">Name</FormLabel>
                      <Input
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        placeholder="Full name"
                        bg="gray.600"
                        borderColor="gray.500"
                        color="white"
                        data-testid="input-recipient-name"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color="gray.200" fontSize="sm">Email</FormLabel>
                      <Input
                        type="email"
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                        placeholder="email@company.com"
                        bg="gray.600"
                        borderColor="gray.500"
                        color="white"
                        data-testid="input-recipient-email"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color="gray.200" fontSize="sm">Role</FormLabel>
                      <Input
                        value={newRecipientRole}
                        onChange={(e) => setNewRecipientRole(e.target.value)}
                        placeholder="Manager, Supervisor, etc."
                        bg="gray.600"
                        borderColor="gray.500"
                        color="white"
                        data-testid="input-recipient-role"
                      />
                    </FormControl>
                  </HStack>
                  <Button
                    leftIcon={<Users className="h-4 w-4" />}
                    colorScheme="green"
                    onClick={handleAddRecipient}
                    isLoading={addRecipientMutation.isPending}
                    alignSelf="flex-start"
                    data-testid="button-add-recipient"
                  >
                    Add Recipient
                  </Button>
                </VStack>
              </Box>

              {/* Current Recipients List */}
              <Box>
                <Heading as="h3" size="sm" color="white" mb={3}>
                  Current Recipients ({recipients.length}/10)
                </Heading>
                {recipientsLoading ? (
                  <Spinner color="blue.400" />
                ) : recipients.length === 0 ? (
                  <Text color="gray.400" fontStyle="italic">
                    No notification recipients configured. Add recipients above to enable email notifications.
                  </Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {recipients.map((recipient: NotificationRecipient) => (
                      <HStack
                        key={recipient.id}
                        p={3}
                        bg={recipient.isActive ? "gray.700" : "gray.800"}
                        rounded="md"
                        borderWidth={1}
                        borderColor={recipient.isActive ? "green.600" : "gray.600"}
                        justify="space-between"
                      >
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text color="white" fontWeight="medium">
                              {recipient.name}
                            </Text>
                            <Badge
                              colorScheme={recipient.isActive ? "green" : "gray"}
                              variant="subtle"
                            >
                              {recipient.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </HStack>
                          <Text color="gray.400" fontSize="sm">
                            {recipient.email} • {recipient.role}
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          colorScheme={recipient.isActive ? "red" : "green"}
                          variant="outline"
                          onClick={() => handleToggleRecipient(recipient.id, recipient.isActive)}
                          isLoading={toggleRecipientMutation.isPending}
                          data-testid={`button-toggle-${recipient.id}`}
                        >
                          {recipient.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

export { SystemSettings };