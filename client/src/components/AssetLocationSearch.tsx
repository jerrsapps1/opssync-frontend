import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input, Box, List, ListItem, Text, Badge, Flex } from "@chakra-ui/react";
import { Search, MapPin, Wrench, Building, Clock, User } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

interface Equipment {
  id: string;
  name: string;
  type: string;
  make: string;
  model: string;
  assetNumber: string;
  status: string;
  currentProjectId: string | null;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  currentProjectId: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface SearchResult {
  type: 'equipment' | 'employee';
  equipment?: Equipment;
  employee?: Employee;
  project?: Project;
  location: string;
  locationIcon: any;
  statusColor: string;
}

export function AssetLocationSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch equipment and employee data - force fresh data
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  // Fetch projects data - force fresh data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  // Create project lookup
  const projectLookup = projects.reduce((acc, project) => {
    acc[project.id] = project;
    return acc;
  }, {} as Record<string, Project>);

  // Filter and create search results for equipment
  const equipmentResults = equipment
    .filter(eq => 
      searchTerm.length >= 2 && 
      ((eq.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (eq.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (eq.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (eq.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (eq.assetNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       eq.id.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .map(eq => {
      let location: string;
      let locationIcon: any;
      let statusColor: string;


      if (eq.status === "maintenance") {
        location = "Repair Shop";
        locationIcon = Wrench;
        statusColor = "orange";
      } else if (eq.currentProjectId) {
        const project = projectLookup[eq.currentProjectId];
        location = project ? project.name : "Assigned Project";
        locationIcon = Building;
        statusColor = "green";
      } else {
        location = "Available";
        locationIcon = Clock;
        statusColor = "blue";
      }

      return {
        type: 'equipment' as const,
        equipment: eq,
        project: eq.currentProjectId ? projectLookup[eq.currentProjectId] : undefined,
        location,
        locationIcon,
        statusColor,
      };
    });

  // Filter and create search results for employees
  const employeeResults = employees
    .filter(emp => {
      const isMatch = searchTerm.length >= 2 && 
        ((emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         emp.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Debug Test Employee matches
      if (isMatch && emp.name.toLowerCase().includes('test')) {
        console.log('🔍 Test Employee match for "' + searchTerm + '":', {
          name: emp.name,
          role: emp.role,
          email: emp.email,
          id: emp.id,
          nameMatch: (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()),
          roleMatch: (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase()),
          emailMatch: (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()),
          idMatch: emp.id.toLowerCase().includes(searchTerm.toLowerCase())
        });
      }
      
      return isMatch;
    })
    .map(emp => {
      let location: string;
      let locationIcon: any;
      let statusColor: string;

      if (emp.currentProjectId) {
        const project = projectLookup[emp.currentProjectId];
        location = project ? project.name : "Assigned Project";
        locationIcon = Building;
        statusColor = "green";
      } else {
        location = "Available";
        locationIcon = User;
        statusColor = "blue";
      }

      return {
        type: 'employee' as const,
        employee: emp,
        project: emp.currentProjectId ? projectLookup[emp.currentProjectId] : undefined,
        location,
        locationIcon,
        statusColor,
      };
    });

  // Combine and limit results
  const searchResults = [...equipmentResults, ...employeeResults].slice(0, 8);

  const handleAssetClick = (result: SearchResult) => {
    setSelectedAsset(result);
    setIsDialogOpen(true);
    setShowResults(false);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.length >= 2);
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow clicks
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <Box position="relative" width="300px" data-testid="asset-location-search">
      <Box position="relative">
        <Search 
          size={16} 
          color="gray" 
          style={{ 
            position: "absolute", 
            left: "12px", 
            top: "50%", 
            transform: "translateY(-50%)",
            zIndex: 2
          }} 
        />
        <Input
          placeholder="Search assets & employees..."
          value={searchTerm}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          bg="gray.700"
          border="1px solid"
          borderColor="gray.600"
          color="white"
          pl="40px"
          size="sm"
          _placeholder={{ color: "gray.400" }}
          _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4A90E2" }}
          data-testid="search-input"
        />
      </Box>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxHeight="300px"
          overflowY="auto"
          mt={1}
          data-testid="search-results"
        >
          <List>
            {searchResults.map((result, index) => (
              <ListItem
                key={result.type === 'equipment' ? result.equipment!.id : result.employee!.id}
                p={3}
                cursor="pointer"
                _hover={{ bg: "gray.700" }}
                borderBottom={index < searchResults.length - 1 ? "1px solid" : "none"}
                borderBottomColor="gray.700"
                onClick={() => handleAssetClick(result)}
                data-testid={`search-result-${result.type === 'equipment' ? result.equipment!.id : result.employee!.id}`}
              >
                <Flex justify="space-between" align="center">
                  <Box flex={1}>
                    <Text color="white" fontWeight="medium" fontSize="sm">
                      {result.type === 'equipment' ? result.equipment!.name : result.employee!.name}
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      {result.type === 'equipment' 
                        ? `${result.equipment!.type} • ${result.equipment!.make}` 
                        : `${result.employee!.role} • Employee`
                      }
                    </Text>
                  </Box>
                  <Flex align="center" gap={2}>
                    <result.locationIcon size={14} color="gray" />
                    <Badge size="sm" colorScheme={result.statusColor} fontSize="xs">
                      {result.location}
                    </Badge>
                  </Flex>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {showResults && searchTerm.length >= 2 && searchResults.length === 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          p={3}
          mt={1}
        >
          <Text color="gray.400" fontSize="sm" textAlign="center">
            No assets or employees found matching "{searchTerm}"
          </Text>
        </Box>
      )}

      {/* Asset Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedAsset?.type === 'equipment' ? 'Asset Location Details' : 'Employee Location Details'}
      >
        {selectedAsset && (
          <Box color="white" data-testid="asset-details-dialog">
            <Flex align="center" gap={3} mb={4}>
              <selectedAsset.locationIcon size={20} color="#4A90E2" />
              <Text fontSize="lg" fontWeight="bold">
                {selectedAsset.type === 'equipment' ? selectedAsset.equipment!.name : selectedAsset.employee!.name}
              </Text>
            </Flex>

            <Box space-y={3}>
              <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                <Text color="gray.400" fontSize="sm">{selectedAsset.type === 'equipment' ? 'Asset ID:' : 'Employee ID:'}</Text>
                <Text fontWeight="medium">{selectedAsset.type === 'equipment' ? selectedAsset.equipment!.id : selectedAsset.employee!.id}</Text>
              </Flex>

              {selectedAsset.type === 'equipment' ? (
                <>
                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Type:</Text>
                    <Text fontWeight="medium">{selectedAsset.equipment!.type}</Text>
                  </Flex>

                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Make/Model:</Text>
                    <Text fontWeight="medium">{selectedAsset.equipment!.make} {selectedAsset.equipment!.model}</Text>
                  </Flex>
                </>
              ) : (
                <>
                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Role:</Text>
                    <Text fontWeight="medium">{selectedAsset.employee!.role}</Text>
                  </Flex>

                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Email:</Text>
                    <Text fontWeight="medium">{selectedAsset.employee!.email}</Text>
                  </Flex>

                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Phone:</Text>
                    <Text fontWeight="medium">{selectedAsset.employee!.phone}</Text>
                  </Flex>
                </>
              )}

              <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                <Text color="gray.400" fontSize="sm">Current Location:</Text>
                <Flex align="center" gap={2}>
                  <selectedAsset.locationIcon size={16} />
                  <Badge colorScheme={selectedAsset.statusColor}>
                    {selectedAsset.location}
                  </Badge>
                </Flex>
              </Flex>

              {selectedAsset.project && (
                <>
                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Project Status:</Text>
                    <Badge colorScheme="blue" size="sm">
                      {selectedAsset.project.status}
                    </Badge>
                  </Flex>

                  <Flex justify="space-between" align="center" py={2}>
                    <Text color="gray.400" fontSize="sm">Project ID:</Text>
                    <Text fontWeight="medium" fontSize="sm" fontFamily="mono">
                      {selectedAsset.project.id}
                    </Text>
                  </Flex>
                </>
              )}

              {selectedAsset.type === 'equipment' && selectedAsset.equipment!.status === "maintenance" && (
                <Box mt={4} p={3} bg="orange.900" borderRadius="md" border="1px solid" borderColor="orange.700">
                  <Flex align="center" gap={2} mb={1}>
                    <Wrench size={16} color="orange" />
                    <Text color="orange.200" fontWeight="medium" fontSize="sm">
                      In Repair Shop
                    </Text>
                  </Flex>
                  <Text color="orange.300" fontSize="xs">
                    This equipment is currently undergoing maintenance or repairs
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}