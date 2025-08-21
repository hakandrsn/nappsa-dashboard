import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Team {
  name: string
  logo: React.ComponentType<{ className?: string }>
  plan: string
}

interface TeamSwitcherProps {
  teams: Team[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const [selectedTeam] = React.useState(teams[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <selectedTeam.logo className="h-5 w-5 mr-2" />
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">{selectedTeam.name}</span>
            <span className="text-xs text-muted-foreground">{selectedTeam.plan}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Takım Seç</p>
            <p className="text-xs leading-none text-muted-foreground">
              Hangi takımı yönetmek istiyorsunuz?
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {teams.map((team, index) => {
            const Logo = team.logo
            return (
              <DropdownMenuItem key={index}>
                <Logo className="h-4 w-4 mr-2" />
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs text-muted-foreground">{team.plan}</span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
